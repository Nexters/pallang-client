import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { commentQueries, REPLY_PREVIEW_SIZE } from '@/app/_global/_queries/comment.queries'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'

const { authState } = vi.hoisted(() => ({ authState: { isAuthenticated: true } }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authState.isAuthenticated,
    signOut: vi.fn(),
  }),
}))

const BOOK_ID = 1
const PAGE = 7
const PASSAGE_ID = 71
/** 같은 페이지의 두 번째 대목 — 인용문 카드를 누르면 여기로 넘어간다 */
const NEXT_PASSAGE_ID = 72

/** 다음 요청부터 실패시킬 횟수. 오류 처리·재시도 경로를 확인하는 데 쓴다 */
const apiFailures = { commentList: 0, commentCreate: 0, replies: 0 }

/** 첫 번째 대목을 스포일러로 내려 가림막 경로를 확인한다 */
const stageState = { isSpoiler: false }

/** 응답을 붙잡아 두는 손잡이 — 요청이 도는 동안의 화면 상태를 확인할 때 쓴다 */
function createGate() {
  // executor는 동기로 실행돼 이 시점 이후 open은 항상 채워져 있다
  let open!: () => void
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { open, opened }
}

/** 값이 있으면 그 요청은 손잡이를 열 때까지 응답하지 않는다 */
const apiGates: Record<'commentCreate' | 'commentRemove', ReturnType<typeof createGate> | null> = {
  commentCreate: null,
  commentRemove: null,
}

const opinionSeed = [
  {
    opinionId: 1,
    userId: 1,
    nickname: '책책책을읽자',
    content: '첫 번째 흔적',
    likeCount: 4,
    createdAt: '2026-07-27T00:00:00.000Z',
  },
  {
    opinionId: 2,
    userId: 2,
    nickname: '밤의독서가',
    content: '두 번째 흔적',
    likeCount: 1,
    createdAt: '2026-07-26T00:00:00.000Z',
  },
]

const commentBase = {
  isDeleted: false,
  createdAt: '2026-07-27T01:00:00.000Z',
  updatedAt: '2026-07-27T01:00:00.000Z',
}

type SeededComment = ReturnType<typeof seedComments>[number]

/** 1번 흔적: 원댓글 7개(더보기 대상) + 2번 원댓글에 답글 6개(답글 더보기 대상) */
function seedComments() {
  const withReplies = {
    ...commentBase,
    commentId: 2,
    userId: 2,
    nickname: '다른사람',
    content: '남이 쓴 댓글',
    replies: Array.from({ length: 5 }, (_, index) => ({
      ...commentBase,
      commentId: 30 + index,
      userId: 2,
      nickname: '다른사람',
      content: `${String(index + 1)}번째 답글`,
    })),
    replyCount: 6,
    hasMoreReplies: true,
  }
  const rest = Array.from({ length: 5 }, (_, index) => ({
    ...commentBase,
    commentId: 10 + index,
    userId: 2,
    nickname: '다른사람',
    content: `여섯째 이후 댓글 ${String(index + 1)}`,
    replies: [],
    replyCount: 0,
    hasMoreReplies: false,
  }))

  return [
    {
      ...commentBase,
      commentId: 1,
      userId: 10,
      nickname: '나',
      content: '내가 쓴 댓글',
      replies: [],
      replyCount: 0,
      hasMoreReplies: false,
    },
    withReplies,
    ...rest,
  ]
}

/**
 * 2번 흔적: replyCount(5)와 미리보기 개수(5)는 같은데 서버는 답글이 더 있다고(hasMoreReplies) 말한다.
 * 개수로 추론하면 더보기가 사라져 남은 답글에 닿을 수 없는 조합이다.
 */
function seedMismatchComment() {
  return {
    ...commentBase,
    commentId: 50,
    userId: 2,
    nickname: '다른사람',
    content: '개수와 어긋나는 댓글',
    replies: Array.from({ length: REPLY_PREVIEW_SIZE }, (_, index) => ({
      ...commentBase,
      commentId: 60 + index,
      userId: 2,
      nickname: '다른사람',
      content: `미리보기 답글 ${String(index + 1)}`,
    })),
    replyCount: REPLY_PREVIEW_SIZE,
    hasMoreReplies: true,
  }
}

/** 흔적 화면 API와 댓글 목록/작성/수정/삭제/답글 API를 상태를 가진 목으로 흉내낸다 */
function stubApi() {
  let comments: SeededComment[] = seedComments()
  const commentsByOpinion = new Map<number, SeededComment[]>([[2, [seedMismatchComment()]]])
  let nextId = 100

  const paged = <T,>(items: T[], url: string, key: 'comments') => {
    const query = new URLSearchParams(url.split('?')[1] ?? '')
    const size = Number(query.get('size') ?? '20')
    const page = Number(query.get('page') ?? '0')
    const offset = page * size
    return {
      data: {
        [key]: items.slice(offset, offset + size),
        pageInfo: {
          page,
          size,
          totalElements: items.length,
          totalPages: Math.ceil(items.length / size),
          hasNext: offset + size < items.length,
        },
      },
    }
  }

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))
      const serverError = () => Promise.resolve(new Response('{}', { status: 500 }))

      if (url.includes('/users/me')) {
        if (!authState.isAuthenticated) {
          return Promise.resolve(new Response('{}', { status: 401 }))
        }
        return json({ data: { userId: 10, nickname: '나' } })
      }

      const opinionMatch = /\/passages\/(\d+)\/opinions/.exec(url)
      if (opinionMatch) {
        return json({
          data: {
            opinions: opinionSeed,
            pageInfo: {
              page: 0,
              size: 20,
              totalElements: opinionSeed.length,
              totalPages: 1,
              hasNext: false,
            },
          },
        })
      }

      const commentsMatch = /\/opinions\/(\d+)\/comments/.exec(url)
      if (commentsMatch) {
        const opinionId = Number(commentsMatch[1])
        const list = opinionId === 1 ? comments : (commentsByOpinion.get(opinionId) ?? [])
        if (method === 'POST') {
          if (apiFailures.commentCreate > 0) {
            apiFailures.commentCreate -= 1
            return serverError()
          }
          const { content } = JSON.parse(options?.body as string) as { content: string }
          const respond = () => {
            const created = {
              ...commentBase,
              commentId: nextId++,
              userId: 10,
              nickname: '나',
              content,
              replies: [],
              replyCount: 0,
              hasMoreReplies: false,
            }
            // ponytail: 새 댓글을 앞에 붙이는(최신순) 가정이다 — 서버 정렬이 오래된 순이면 새 댓글은
            // 아직 불러오지 않은 마지막 페이지에 놓여 화면에 나타나지 않는다(useCommentActions 참고).
            if (opinionId === 1) comments = [created, ...comments]
            else commentsByOpinion.set(opinionId, [created, ...list])
            return json({ data: created })
          }
          const gate = apiGates.commentCreate
          return gate ? gate.opened.then(respond) : respond()
        }
        if (apiFailures.commentList > 0) {
          apiFailures.commentList -= 1
          return serverError()
        }
        return json(paged(opinionId === 1 ? comments : list, url, 'comments'))
      }

      if (/\/comments\/\d+\/replies/.test(url)) {
        if (apiFailures.replies > 0) {
          apiFailures.replies -= 1
          return serverError()
        }
        const replies = Array.from({ length: 6 }, (_, index) => ({
          ...commentBase,
          commentId: 30 + index,
          userId: 2,
          nickname: '다른사람',
          content: `${String(index + 1)}번째 답글`,
        }))
        return json(paged(replies, url, 'comments'))
      }

      const commentMatch = /\/comments\/(\d+)/.exec(url)
      if (commentMatch) {
        const commentId = Number(commentMatch[1])
        if (method === 'PATCH') {
          const { content } = JSON.parse(options?.body as string) as { content: string }
          comments = comments.map((c) => (c.commentId === commentId ? { ...c, content } : c))
        }
        if (method === 'DELETE') {
          const respond = () => {
            comments = comments.map((c) =>
              c.commentId === commentId ? { ...c, isDeleted: true } : c,
            )
            return Promise.resolve(new Response(null, { status: 204 }))
          }
          const gate = apiGates.commentRemove
          return gate ? gate.opened.then(respond) : respond()
        }
        return json({ data: comments.find((c) => c.commentId === commentId) })
      }

      if (/\/pages\/\d+\/passages/.test(url)) {
        // 대목 전환(인용문 카드 클릭)으로 passageId가 바뀌는 경로를 만들려고 두 개를 준다
        return json({
          data: {
            passages: [
              {
                passageId: PASSAGE_ID,
                quotedText: '첫 번째 대목 인용문',
                isSpoiler: stageState.isSpoiler,
              },
              { passageId: NEXT_PASSAGE_ID, quotedText: '두 번째 대목 인용문', isSpoiler: false },
            ],
          },
        })
      }

      return json({ data: { pageNumbers: [PAGE] } })
    }),
  )
}

async function renderView() {
  stubApi()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>
        <TraceCollapseView bookId={BOOK_ID} />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
  await screen.findByText('첫 번째 흔적')
  return client
}

/** index번째 흔적의 댓글 아이콘 */
function commentToggle(index: number) {
  const toggle = screen.getAllByRole('button', { name: '댓글 보기' })[index]
  if (!toggle) throw new Error(`댓글 보기 버튼 ${String(index)}번을 찾지 못했다`)
  return toggle
}

async function openFirstTraceComments() {
  const client = await renderView()
  fireEvent.click(commentToggle(0))
  await screen.findByText('내가 쓴 댓글')
  return client
}

/** 답글을 두 단계까지 펼친다 — 미리보기 5개 → 서버에서 받은 6번째 */
async function revealAllReplies() {
  fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
  await screen.findByText('5번째 답글')
  fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
  await screen.findByText('6번째 답글')
}

describe('흔적 댓글 인라인 펼침', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
    apiFailures.commentList = 0
    apiFailures.commentCreate = 0
    apiFailures.replies = 0
    apiGates.commentCreate = null
    apiGates.commentRemove = null
    stageState.isSpoiler = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('댓글 아이콘을 누르면 화면을 바꾸지 않고 흔적 아래로 댓글이 펼쳐진다', async () => {
    await openFirstTraceComments()

    // 풀스크린 오버레이로 전환되지 않는다 — 목록은 그대로 보인다
    expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
    expect(screen.getByText('두 번째 흔적')).toBeInTheDocument()
    // 댓글 묶음은 해당 흔적과 같은 목록 항목 안에 들어간다
    const item = screen.getByText('첫 번째 흔적').closest('li')
    expect(within(item as HTMLElement).getByLabelText('댓글 목록')).toBeInTheDocument()
  })

  it('댓글이 펼쳐지면 하단에 댓글 입력바가 나타나고, 접으면 사라진다', async () => {
    await openFirstTraceComments()
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    fireEvent.click(commentToggle(0))
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('다른 흔적의 댓글을 열면 앞서 열린 댓글은 닫힌다(아코디언)', async () => {
    await openFirstTraceComments()

    fireEvent.click(commentToggle(1))
    expect(await screen.findByLabelText('댓글 목록')).toBeInTheDocument()
    expect(screen.getAllByLabelText('댓글 목록')).toHaveLength(1)
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('댓글은 5개까지 보이고 더보기를 누르면 5개씩 이어 붙는다', async () => {
    await openFirstTraceComments()

    expect(screen.getByText('여섯째 이후 댓글 3')).toBeInTheDocument()
    expect(screen.queryByText('여섯째 이후 댓글 4')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '댓글 더보기' }))

    expect(await screen.findByText('여섯째 이후 댓글 5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '댓글 더보기' })).not.toBeInTheDocument()
  })

  it('답글은 접힌 채로 시작해 답글 더보기를 누를 때마다 5개씩 펼쳐진다', async () => {
    await openFirstTraceComments()

    // 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나므로 접힌 채로 시작한다
    expect(screen.queryByText('1번째 답글')).not.toBeInTheDocument()

    // 1번째: 원댓글 응답이 준 미리보기 5개 (추가 요청 없음)
    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    expect(await screen.findByText('5번째 답글')).toBeInTheDocument()
    expect(screen.queryByText('6번째 답글')).not.toBeInTheDocument()

    // 2번째: 다음 5개를 서버에서 이어 받는다
    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    expect(await screen.findByText('6번째 답글')).toBeInTheDocument()
    expect(screen.getByText('1번째 답글')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글 더보기' })).not.toBeInTheDocument()
  })

  it('답글이 없는 댓글에는 답글 더보기가 없다', async () => {
    await openFirstTraceComments()

    // 시드에서 답글이 있는 원댓글은 1개뿐이다
    expect(screen.getAllByRole('button', { name: '답글 더보기' })).toHaveLength(1)
  })

  it('댓글을 등록하면 서버에 저장되고 목록이 갱신된다', async () => {
    await openFirstTraceComments()

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    expect(await screen.findByText('새 댓글')).toBeInTheDocument()
    // 입력창은 등록이 끝난 뒤에 비워진다
    await waitFor(() => {
      expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toHaveValue('')
    })
  })

  it('빈 댓글은 등록 버튼이 비활성화된다', async () => {
    await openFirstTraceComments()

    expect(screen.getByRole('button', { name: '댓글 등록' })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '  ' },
    })
    expect(screen.getByRole('button', { name: '댓글 등록' })).toBeDisabled()
  })

  it('수정·삭제 버튼은 본인 댓글에만 보인다', async () => {
    await openFirstTraceComments()

    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(1)
  })

  it('본인 댓글을 수정할 수 있다', async () => {
    await openFirstTraceComments()

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('댓글 수정 입력'), { target: { value: '고친 댓글' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('고친 댓글')).toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('본인 댓글을 삭제하면 삭제된 댓글로 표시된다', async () => {
    await openFirstTraceComments()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('삭제된 댓글입니다')).toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('비로그인이어도 댓글은 열람할 수 있고, 등록만 로그인 게이트가 막는다', async () => {
    authState.isAuthenticated = false
    await openFirstTraceComments()

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    expect(screen.getByText(LOGIN_GATE_MESSAGE.commentCreate)).toBeInTheDocument()
    const postCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([, options]) => options?.method === 'POST')
    expect(postCalls).toHaveLength(0)
  })

  it('대목이 바뀌면 펼친 댓글과 하단 입력바가 함께 닫힌다', async () => {
    await openFirstTraceComments()
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    // 인용문 카드를 누르면 다음 대목으로 넘어가 목록이 통째로 갈린다
    fireEvent.click(screen.getByRole('button', { name: '첫 번째 대목 인용문' }))

    // 입력바만 남으면 화면에 보이지도 않는 이전 대목의 흔적에 댓글이 등록된다
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    })
    expect(screen.queryByLabelText('댓글 목록')).not.toBeInTheDocument()
  })

  it('답글을 접었다 다시 펴도 한 번에 5개씩만 늘어난다', async () => {
    await openFirstTraceComments()
    await revealAllReplies()

    // 접으면 revealStep은 0으로 돌아가지만 답글 캐시는 남는다
    fireEvent.click(commentToggle(0))
    fireEvent.click(commentToggle(0))
    await screen.findByText('내가 쓴 댓글')

    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))

    expect(await screen.findByText('5번째 답글')).toBeInTheDocument()
    // 남아 있던 캐시가 새면 미리보기 5개와 함께 10개가 한꺼번에 나온다
    expect(screen.queryByText('6번째 답글')).not.toBeInTheDocument()
  })

  it('답글 로드가 실패해도 다시 시도할 수 있다', async () => {
    apiFailures.replies = 1
    await openFirstTraceComments()

    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    await screen.findByText('5번째 답글')
    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))

    // 버튼이 사라지면 재시도할 길이 없다
    fireEvent.click(await screen.findByRole('button', { name: '답글 다시 불러오기' }))

    expect(await screen.findByText('6번째 답글')).toBeInTheDocument()
  })

  it('답글 요청은 서버가 고정으로 준 미리보기 구간 바로 뒤에서 시작한다', async () => {
    await openFirstTraceComments()
    await revealAllReplies()

    const repliesUrl = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => url)
      .find((url): url is string => typeof url === 'string' && url.includes('/replies'))
    const query = new URLSearchParams(repliesUrl?.split('?')[1] ?? '')

    // page * size가 미리보기 개수와 어긋나면 그 사이의 답글이 조용히 사라진다
    expect(Number(query.get('page')) * Number(query.get('size'))).toBe(REPLY_PREVIEW_SIZE)
  })

  it('댓글 조회가 실패하면 오류가 드러나고 다시 시도할 수 있다', async () => {
    apiFailures.commentList = 1
    await renderView()

    fireEvent.click(commentToggle(0))

    // 실패가 빈 목록("댓글 없음")과 같아 보이면 안 된다
    expect(await screen.findByText('댓글을 불러오지 못했어요.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '댓글 다시 불러오기' }))

    expect(await screen.findByText('내가 쓴 댓글')).toBeInTheDocument()
  })

  it('로그인 게이트가 막으면 입력한 댓글이 그대로 남는다', async () => {
    authState.isAuthenticated = false
    await openFirstTraceComments()

    const input = screen.getByPlaceholderText('댓글을 입력해주세요')
    fireEvent.change(input, { target: { value: '남아야 하는 댓글' } })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    expect(await screen.findByText(LOGIN_GATE_MESSAGE.commentCreate)).toBeInTheDocument()
    // 지워버리면 로그인한 뒤 처음부터 다시 써야 한다
    expect(input).toHaveValue('남아야 하는 댓글')
  })

  it('등록에 실패하면 입력한 댓글이 그대로 남는다', async () => {
    apiFailures.commentCreate = 1
    await openFirstTraceComments()

    const input = screen.getByPlaceholderText('댓글을 입력해주세요')
    fireEvent.change(input, { target: { value: '실패한 댓글' } })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    await waitFor(() => {
      const postCalls = vi
        .mocked(fetch)
        .mock.calls.filter(([, options]) => options?.method === 'POST')
      expect(postCalls).toHaveLength(1)
    })
    expect(input).toHaveValue('실패한 댓글')
  })

  it('댓글 등록 무효화는 다른 흔적의 댓글 캐시를 건드리지 않는다', async () => {
    const client = await openFirstTraceComments()
    const otherKey = commentQueries.listByOpinion(2).queryKey
    client.setQueryData(otherKey, { pages: [], pageParams: [] })

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))
    await screen.findByText('새 댓글')

    // ['comment'] 전체를 무효화하면 열지도 않은 흔적의 캐시까지 낡은 것이 된다
    expect(client.getQueryState(otherKey)?.isInvalidated).toBe(false)
  })

  it('상세 오버레이가 열려 있는 동안 하단 입력바는 포커스 대상에서 빠진다', async () => {
    await openFirstTraceComments()
    const bar = screen.getByPlaceholderText('댓글을 입력해주세요').closest('form')
    expect(bar).not.toHaveAttribute('inert')

    fireEvent.click(screen.getByRole('button', { name: '첫 번째 흔적' }))

    expect(await screen.findByRole('dialog', { name: '의견 상세' })).toBeInTheDocument()
    expect(bar).toHaveAttribute('inert')
  })

  it('댓글 더보기가 실패해도 이미 보이던 댓글은 남는다', async () => {
    await openFirstTraceComments()

    apiFailures.commentList = 1
    fireEvent.click(screen.getByRole('button', { name: '댓글 더보기' }))

    const retry = await screen.findByRole('button', {
      name: '댓글을 더 불러오지 못했어요. 다시 시도',
    })
    // isError를 "데이터 없음"으로 다루면 보이던 첫 페이지가 오류 화면으로 통째로 갈린다
    expect(screen.getByText('내가 쓴 댓글')).toBeInTheDocument()
    expect(screen.queryByText('댓글을 불러오지 못했어요.')).not.toBeInTheDocument()

    fireEvent.click(retry)
    expect(await screen.findByText('여섯째 이후 댓글 5')).toBeInTheDocument()
  })

  it('등록 뒤 목록 갱신이 실패해도 보이던 댓글은 남는다', async () => {
    await openFirstTraceComments()

    // 등록은 성공하고 뒤따르는 무효화 리페치만 실패한다
    apiFailures.commentList = 1
    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    const retry = await screen.findByRole('button', { name: '댓글을 갱신하지 못했어요. 다시 시도' })
    // 등록은 됐는데 화면이 "댓글을 불러오지 못했어요"로 바뀌면 안 된다
    expect(screen.getByText('내가 쓴 댓글')).toBeInTheDocument()
    expect(screen.queryByText('댓글을 불러오지 못했어요.')).not.toBeInTheDocument()

    fireEvent.click(retry)
    expect(await screen.findByText('새 댓글')).toBeInTheDocument()
  })

  it('전송 중에는 다시 제출해도 댓글이 두 번 등록되지 않는다', async () => {
    const gate = createGate()
    apiGates.commentCreate = gate
    await openFirstTraceComments()

    const input = screen.getByPlaceholderText('댓글을 입력해주세요')
    fireEvent.change(input, { target: { value: '한 번만 등록될 댓글' } })
    const submit = screen.getByRole('button', { name: '댓글 등록' })
    fireEvent.click(submit)

    // 전송 중 아무 표시가 없으면 실패한 줄 알고 다시 누르게 된다
    await waitFor(() => {
      expect(submit).toHaveAttribute('aria-busy', 'true')
    })
    expect(submit).toBeDisabled()

    // 버튼이 막혀도 폼 제출(입력창 Enter)은 남아 있다
    const form = input.closest('form')
    if (!form) throw new Error('댓글 입력바의 form을 찾지 못했다')
    fireEvent.submit(form)
    gate.open()

    expect(await screen.findByText('한 번만 등록될 댓글')).toBeInTheDocument()
    const postCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([, options]) => options?.method === 'POST')
    expect(postCalls).toHaveLength(1)
  })

  it('전송 중에 이어 쓴 내용은 등록이 끝나도 지워지지 않는다', async () => {
    const gate = createGate()
    apiGates.commentCreate = gate
    await openFirstTraceComments()

    const input = screen.getByPlaceholderText('댓글을 입력해주세요')
    fireEvent.change(input, { target: { value: '보낸 댓글' } })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))
    // 응답을 기다리는 동안 다음 댓글을 이어 쓴다
    fireEvent.change(input, { target: { value: '아직 안 보낸 댓글' } })
    gate.open()

    expect(await screen.findByText('보낸 댓글')).toBeInTheDocument()
    // 성공했다고 무조건 비우면 등록되지도 않은 입력이 통째로 사라진다
    expect(input).toHaveValue('아직 안 보낸 댓글')
  })

  it('답글 더보기 여부는 서버의 hasMoreReplies를 따른다', async () => {
    await renderView()
    fireEvent.click(commentToggle(1))
    await screen.findByText('개수와 어긋나는 댓글')

    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    expect(
      await screen.findByText(`미리보기 답글 ${String(REPLY_PREVIEW_SIZE)}`),
    ).toBeInTheDocument()

    // replyCount와 미리보기 개수로 추론하면 버튼이 사라져 남은 답글에 닿을 수 없다
    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    expect(await screen.findByText('6번째 답글')).toBeInTheDocument()
  })

  it('답글을 펼친 채 삭제하고 곧바로 접어도 답글 캐시가 낡은 채로 남지 않는다', async () => {
    const gate = createGate()
    apiGates.commentRemove = gate
    const client = await openFirstTraceComments()
    await revealAllReplies()

    const repliesKey = commentQueries.replies(2).queryKey
    const countRepliesCalls = () =>
      vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/replies')).length
    const repliesCallsBeforeRemove = countRepliesCalls()

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    // 삭제가 끝나기 전에 아코디언을 접으면 답글 쿼리의 관찰자가 사라진다
    fireEvent.click(commentToggle(0))
    gate.open()

    // 관찰자로 좁힌 무효화는 이 순간을 놓쳐 삭제 전 답글이 그대로 남는다
    await waitFor(() => {
      expect(client.getQueryState(repliesKey)?.isInvalidated).toBe(true)
    })
    // 키 전체를 무효화해도 비싸지 않다 — 기본 refetchType이 'active'라 관찰자 없는 쿼리는 재조회되지 않는다
    expect(countRepliesCalls()).toBe(repliesCallsBeforeRemove)
  })

  it('가림막이 다시 씌워지면 펼친 댓글과 하단 입력바가 함께 닫힌다', async () => {
    stageState.isSpoiler = true
    await renderView()

    // 가림막을 해제해야 목록을 읽을 수 있다
    fireEvent.click(screen.getByRole('button', { name: /첫 번째 대목 인용문/ }))
    fireEvent.click(commentToggle(0))
    await screen.findByText('내가 쓴 댓글')
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    // 같은 페이지 탭을 다시 누르면 해제가 풀린다 — passageId는 그대로라 대목 전환 리셋에 걸리지 않는다
    fireEvent.click(screen.getByRole('button', { name: `${String(PAGE)}p` }))

    // 목록만 흐려지고 입력바가 남으면 더는 읽을 수 없는 흔적에 댓글을 쓸 수 있다
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    })
    expect(screen.queryByLabelText('댓글 목록')).not.toBeInTheDocument()
  })
})
