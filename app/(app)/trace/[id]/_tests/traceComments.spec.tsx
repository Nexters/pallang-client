import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { commentQueries, REPLY_PREVIEW_SIZE } from '@/app/_global/_queries/comment.queries'

import { TraceScreen } from '../_components/TraceScreen/TraceScreen'

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
/** 쪽 선택기는 현재 쪽을 목록에서 빼고 그리므로, 고를 수 있는 다른 쪽을 하나 더 둔다 */
const OTHER_PAGE = 9
const PASSAGE_ID = 71
/** 같은 페이지의 두 번째 대목 — 인용문 카드를 누르면 여기로 넘어간다 */
const NEXT_PASSAGE_ID = 72

/** 다음 요청부터 실패시킬 횟수. 오류 처리·재시도 경로를 확인하는 데 쓴다 */
const apiFailures = { commentList: 0, commentCreate: 0, replies: 0 }

/** 첫 번째 대목을 스포일러로 내려 가림막 경로를 확인한다 */
const stageState = { isSpoiler: false }

/** 켜면 댓글 목록이 빈 채로 내려온다 — 첫 댓글을 권하는 빈 상태를 확인하는 데 쓴다 */
const commentState = { isEmpty: false }

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
    commentCount: 7,
    createdAt: '2026-07-27T00:00:00.000Z',
  },
  {
    opinionId: 2,
    userId: 2,
    nickname: '밤의독서가',
    content: '두 번째 흔적',
    likeCount: 1,
    commentCount: 1,
    createdAt: '2026-07-26T00:00:00.000Z',
  },
]

const commentBase = {
  isDeleted: false,
  createdAt: '2026-07-27T01:00:00.000Z',
  updatedAt: '2026-07-27T01:00:00.000Z',
}

type SeededComment = ReturnType<typeof seedComments>[number]

/** 1번 흔적: 원댓글 7개(더보기 대상) + 내 원댓글(1번)에 답글 6개(답글 뷰 대상).
    답글 달린 원댓글이 내 것이어야 답글 뷰 안에서 삭제 흐름(캐시 무효화 검증)까지 태울 수 있다 */
function seedComments() {
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
      replies: Array.from({ length: 5 }, (_, index) => ({
        ...commentBase,
        commentId: 30 + index,
        userId: 2,
        nickname: '다른사람',
        content: `${String(index + 1)}번째 답글`,
      })),
      replyCount: 6,
      hasMoreReplies: true,
    },
    {
      ...commentBase,
      commentId: 2,
      userId: 2,
      nickname: '다른사람',
      content: '남이 쓴 댓글',
      replies: [],
      replyCount: 0,
      hasMoreReplies: false,
    },
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
  let comments: SeededComment[] = commentState.isEmpty ? [] : seedComments()
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
        // 댓글 수는 서버가 그때그때 세어 준다 — 댓글을 달면 다음 목록 응답부터 늘어난다
        const opinions = opinionSeed.map((opinion) =>
          opinion.opinionId === 1 ? { ...opinion, commentCount: comments.length } : opinion,
        )
        return json({
          data: {
            opinions,
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
          const { content, parentCommentId } = JSON.parse(options?.body as string) as {
            content: string
            parentCommentId?: number
          }
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
            // parentCommentId가 실리면 답글이다 — 그 원댓글의 미리보기와 개수에 붙는다
            if (parentCommentId !== undefined) {
              const attach = (target: typeof comments) =>
                target.map((comment) =>
                  comment.commentId === parentCommentId
                    ? {
                        ...comment,
                        replies: [...comment.replies, created],
                        replyCount: comment.replyCount + 1,
                      }
                    : comment,
                )
              if (opinionId === 1) comments = attach(comments)
              else commentsByOpinion.set(opinionId, attach(list))
              return json({ data: created })
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

      return json({ data: { pageNumbers: [PAGE, OTHER_PAGE] } })
    }),
  )
}

async function renderView() {
  stubApi()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  render(
    <QueryClientProvider client={client}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <TraceScreen bookId={BOOK_ID} />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
  await screen.findByText('첫 번째 흔적')
  return client
}

/** index번째 흔적의 댓글 아이콘.
    댓글 시트가 떠 있는 동안 뒤의 목록은 보조기기 트리에서 빠지므로 hidden까지 훑어 잡는다 —
    시트를 띄운 채로 뒤 카드의 댓글 수가 갱신되는지 보는 테스트가 있다 */
function commentToggle(index: number) {
  const toggle = screen.getAllByRole('button', { name: '댓글 보기', hidden: true })[index]
  if (!toggle) throw new Error(`댓글 보기 버튼 ${String(index)}번을 찾지 못했다`)
  return toggle
}

/** 첫 흔적의 댓글 아이콘을 눌러 댓글 시트를 올린다 */
async function openFirstTraceComments() {
  const client = await renderView()
  fireEvent.click(commentToggle(0))
  await screen.findByText('내가 쓴 댓글')
  return client
}

/** 댓글 시트를 내린다 */
async function collapseComments() {
  await userEvent.click(screen.getByRole('button', { name: '닫기' }))
  await waitFor(() => {
    expect(screen.queryByLabelText('댓글 목록')).not.toBeInTheDocument()
  })
}

/** 답글 시트를 열고 끝까지 펼친다 — 열면 미리보기 5개가 서고, 더보기로 6번째를 받는다 */
async function revealAllReplies() {
  fireEvent.click(screen.getByRole('button', { name: '답글 6개 보기' }))
  await screen.findByText('5번째 답글')
  fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
  await screen.findByText('6번째 답글')
}

/** 답글 뷰만 접는다 — 시트는 그대로 남아 댓글 뷰로 돌아온다 */
async function closeReplySheet() {
  fireEvent.click(screen.getByRole('button', { name: '닫기' }))
  await waitFor(() => {
    expect(screen.queryByLabelText('답글 목록')).not.toBeInTheDocument()
  })
}

describe('의견 목록 시트와 댓글 시트 흐름', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
    apiFailures.commentList = 0
    apiFailures.commentCreate = 0
    apiFailures.replies = 0
    apiGates.commentCreate = null
    apiGates.commentRemove = null
    stageState.isSpoiler = false
    commentState.isEmpty = false
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('"N개의 의견"을 누르면 목록 시트가 화면을 채우도록 올라온다', async () => {
    await renderView()
    const handle = screen.getByRole('button', { name: '의견 목록 펼치기' })
    expect(handle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: /개의 의견/ }))

    // 별도 모달이 아니라 원래 있던 시트가 올라온다 — 목록은 그 자리에 그대로다
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '의견 목록 접기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('첫 번째 흔적')).toBeInTheDocument()
    expect(screen.getByText('두 번째 흔적')).toBeInTheDocument()
  })

  it('손잡이를 누르면 시트가 두 높이를 오간다', async () => {
    await renderView()

    fireEvent.click(screen.getByRole('button', { name: '의견 목록 펼치기' }))
    expect(screen.getByRole('button', { name: '의견 목록 접기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '의견 목록 접기' }))
    expect(screen.getByRole('button', { name: '의견 목록 펼치기' })).toBeInTheDocument()
  })

  it('흔적의 댓글 아이콘을 누르면 댓글 시트가 목록 위로 겹쳐 올라온다', async () => {
    await openFirstTraceComments()

    const sheet = await screen.findByRole('dialog', { name: '댓글 (7)' })
    // 원본 의견이 댓글의 머리로 함께 실려 온다
    expect(within(sheet).getByText('첫 번째 흔적')).toBeInTheDocument()
    expect(within(sheet).getByLabelText('댓글 목록')).toBeInTheDocument()
  })

  it('댓글 시트에는 입력바가 딸려 오고, 내리면 함께 사라진다', async () => {
    await openFirstTraceComments()
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()
    // 입력바와 남기기 FAB은 화면 하단 같은 자리를 다툰다 — 겹치지 않게 FAB이 물러난다
    expect(screen.queryByRole('button', { name: '남기기' })).not.toBeInTheDocument()

    await collapseComments()
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '남기기' })).toBeInTheDocument()
  })

  it('댓글 시트를 내리면 뒤에 있던 흔적 목록이 그대로 남아 있다', async () => {
    await openFirstTraceComments()

    await collapseComments()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('첫 번째 흔적')).toBeInTheDocument()
    expect(screen.getByText('두 번째 흔적')).toBeInTheDocument()
  })

  it('댓글이 하나도 없으면 첫 댓글을 권하는 안내가 자리를 지킨다', async () => {
    commentState.isEmpty = true
    await renderView()
    fireEvent.click(commentToggle(0))

    // 비워두면 의견 카드 아래가 그냥 붙어 "없다"는 사실이 화면에 남지 않는다
    expect(await screen.findByText('아직 남겨진 댓글이 없습니다.')).toBeInTheDocument()
    expect(screen.getByText('첫번째 댓글을 달아주세요!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()
  })

  it('댓글은 5개까지 보이고 더보기를 누르면 5개씩 이어 붙는다', async () => {
    await openFirstTraceComments()

    expect(screen.getByText('여섯째 이후 댓글 3')).toBeInTheDocument()
    expect(screen.queryByText('여섯째 이후 댓글 4')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '댓글 더보기' }))

    expect(await screen.findByText('여섯째 이후 댓글 5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '댓글 더보기' })).not.toBeInTheDocument()
  })

  it('답글은 목록에 펼쳐지지 않고, 답글 N개 보기가 답글 시트를 연다', async () => {
    await openFirstTraceComments()

    // 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나므로 목록에는 원댓글만 남긴다(#367)
    expect(screen.queryByText('1번째 답글')).not.toBeInTheDocument()

    // 시트가 열리면 원댓글 응답이 준 미리보기 5개가 요청 없이 바로 선다
    fireEvent.click(screen.getByRole('button', { name: '답글 6개 보기' }))
    expect(await screen.findByText('답글 (6)')).toBeInTheDocument()
    expect(await screen.findByText('5번째 답글')).toBeInTheDocument()
    expect(screen.queryByText('6번째 답글')).not.toBeInTheDocument()

    // 다음 5개는 더보기로 서버에서 이어 받는다
    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))
    expect(await screen.findByText('6번째 답글')).toBeInTheDocument()
    expect(screen.getByText('1번째 답글')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글 더보기' })).not.toBeInTheDocument()
  })

  it('답글 뷰는 같은 시트 안에서 전환된다 — 시트가 한 겹뿐이고 뒤로가 댓글 뷰로 되돌린다', async () => {
    await openFirstTraceComments()

    fireEvent.click(screen.getByRole('button', { name: '답글 6개 보기' }))
    await screen.findByText('답글 (6)')

    // 새 시트가 또 올라오는 게 아니라 본문·헤더가 갈아끼워진다(#373)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(await screen.findByText(/^댓글 \(/)).toBeInTheDocument()
    expect(screen.queryByLabelText('답글 목록')).not.toBeInTheDocument()
  })

  it('답글이 없는 댓글에는 답글 달기 줄이, 있는 댓글에는 개수 줄이 선다', async () => {
    await openFirstTraceComments()

    // 시드에서 답글이 있는 원댓글은 1개뿐이고, 나머지 넷은 작성으로 들어가는 길만 남는다
    expect(screen.getAllByRole('button', { name: '답글 6개 보기' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: '답글 달기' })).toHaveLength(4)
  })

  it('답글 달기로 시트를 열고 등록하면 그 댓글의 답글로 달린다', async () => {
    await openFirstTraceComments()

    const replyEntry = screen.getAllByRole('button', { name: '답글 달기' })[0]
    if (!replyEntry) throw new Error('답글 달기 줄을 찾지 못했다')
    fireEvent.click(replyEntry)
    expect(await screen.findByText('답글 (0)')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('답글을 입력해주세요'), {
      target: { value: '첫 답글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '답글 등록' }))

    // 목록 갱신이 미리보기와 제목 개수에 함께 실린다
    expect(await screen.findByText('첫 답글')).toBeInTheDocument()
    expect(await screen.findByText('답글 (1)')).toBeInTheDocument()
    // 서버가 받은 등록에는 원댓글 좌표가 실린다
    const postCall = vi
      .mocked(fetch)
      .mock.calls.filter(([, options]) => options?.method === 'POST')
      .at(-1)
    if (!postCall) throw new Error('답글 등록 요청이 없다')
    const body = JSON.parse(postCall[1]?.body as string) as { parentCommentId?: number }
    expect(typeof body.parentCommentId).toBe('number')
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

  it('댓글을 등록하면 흔적 카드의 댓글 수도 함께 오른다', async () => {
    await openFirstTraceComments()
    expect(commentToggle(0)).toHaveTextContent('7')

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    // 댓글 수는 흔적 목록 응답에서 오므로 댓글 캐시만 갱신하면 옛 숫자가 그대로 남는다
    await waitFor(() => {
      expect(commentToggle(0)).toHaveTextContent('8')
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

  it('대목이 바뀌면 댓글 시트가 입력바째 닫힌다', async () => {
    await renderView()
    const card = screen.getByText('첫 번째 대목 인용문')
    fireEvent.click(commentToggle(0))
    await screen.findByText('내가 쓴 댓글')
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    // 인용문 카드를 옆으로 넘기면 다음 대목으로 이동해 목록이 통째로 갈린다(#131)
    fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 200 }] })
    fireEvent.touchMove(card, { touches: [{ clientX: 140, clientY: 200 }] })
    fireEvent.touchEnd(card, { touches: [] })

    // 입력바만 남으면 화면에 보이지도 않는 이전 대목의 흔적에 댓글이 등록된다
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    })
    expect(screen.queryByLabelText('댓글 목록')).not.toBeInTheDocument()
  })

  it('답글 시트를 닫았다 다시 열어도 미리보기부터 5개씩 선다', async () => {
    await openFirstTraceComments()
    await revealAllReplies()

    // 시트가 닫히면 펼침 단계는 사라지지만 답글 캐시는 남는다
    await closeReplySheet()
    fireEvent.click(screen.getByRole('button', { name: '답글 6개 보기' }))

    expect(await screen.findByText('5번째 답글')).toBeInTheDocument()
    // 남아 있던 캐시가 새면 미리보기 5개와 함께 10개가 한꺼번에 나온다
    expect(screen.queryByText('6번째 답글')).not.toBeInTheDocument()
  })

  it('답글 로드가 실패해도 다시 시도할 수 있다', async () => {
    apiFailures.replies = 1
    await openFirstTraceComments()

    fireEvent.click(screen.getByRole('button', { name: '답글 6개 보기' }))
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

  it('답글 등록 무효화는 다른 흔적의 댓글 캐시를 건드리지 않는다', async () => {
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

  it('댓글 시트가 덮고 있는 동안 뒤의 흔적 목록은 포커스 대상에서 빠진다', async () => {
    await openFirstTraceComments()

    // 목록이 시트 아래에 남아 있어도 포커스·보조기기로는 닿지 않아야 한다
    expect(screen.queryByRole('button', { name: '댓글 보기' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '댓글 보기', hidden: true })).toHaveLength(2)
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

    fireEvent.click(screen.getByRole('button', { name: '답글 5개 보기' }))
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

    const repliesKey = commentQueries.replies(1).queryKey
    const countRepliesCalls = () =>
      vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => typeof url === 'string' && url.includes('/replies')).length
    const repliesCallsBeforeRemove = countRepliesCalls()

    // 답글 뷰 안 원댓글(내 것)의 삭제다 — 본문이 갈아끼워져 뒤에 다른 삭제 버튼이 없다
    fireEvent.click(screen.getByRole('button', { name: '삭제' }))
    // 삭제가 끝나기 전에 답글 뷰를 접으면 답글 쿼리의 관찰자가 사라진다
    await closeReplySheet()
    await collapseComments()
    gate.open()

    // 관찰자로 좁힌 무효화는 이 순간을 놓쳐 삭제 전 답글이 그대로 남는다
    await waitFor(() => {
      expect(client.getQueryState(repliesKey)?.isInvalidated).toBe(true)
    })
    // 키 전체를 무효화해도 비싸지 않다 — 기본 refetchType이 'active'라 관찰자 없는 쿼리는 재조회되지 않는다
    expect(countRepliesCalls()).toBe(repliesCallsBeforeRemove)
  })

  it('가림막이 다시 씌워지면 댓글 시트가 입력바째 닫힌다', async () => {
    stageState.isSpoiler = true
    await renderView()

    const pageSelect = screen.getByLabelText('쪽 선택')
    // 가림막을 해제해야 목록을 읽을 수 있다
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    fireEvent.click(commentToggle(0))
    await screen.findByText('내가 쓴 댓글')
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    // 다른 쪽을 고르면 해제가 풀린다 — 대목 응답이 같아 passageId는 그대로라, 대목 전환 리셋에 걸리지 않는다.
    // 시트 뒤의 요소는 aria-hidden이라 역할 조회에 hidden을 허용하고, 클릭도 fireEvent로 직접 보낸다.
    fireEvent.click(pageSelect)
    fireEvent.click(
      await screen.findByRole('option', { name: `${String(OTHER_PAGE)}p`, hidden: true }),
    )

    // 목록만 흐려지고 입력바가 남으면 더는 읽을 수 없는 흔적에 댓글을 쓸 수 있다
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    })
    expect(screen.queryByLabelText('댓글 목록')).not.toBeInTheDocument()
  })
})
