import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

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

/** 흔적 화면 API와 댓글 목록/작성/수정/삭제/답글 API를 상태를 가진 목으로 흉내낸다 */
function stubApi() {
  let comments: SeededComment[] = seedComments()
  const commentsByOpinion = new Map<number, SeededComment[]>([[2, []]])
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
          const { content } = JSON.parse(options?.body as string) as { content: string }
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
          if (opinionId === 1) comments = [created, ...comments]
          else commentsByOpinion.set(opinionId, [created, ...list])
          return json({ data: created })
        }
        return json(paged(opinionId === 1 ? comments : list, url, 'comments'))
      }

      if (/\/comments\/\d+\/replies/.test(url)) {
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
          comments = comments.map((c) =>
            c.commentId === commentId ? { ...c, isDeleted: true } : c,
          )
          return Promise.resolve(new Response(null, { status: 204 }))
        }
        return json({ data: comments.find((c) => c.commentId === commentId) })
      }

      if (/\/pages\/\d+\/passages/.test(url)) {
        return json({
          data: {
            passages: [
              { passageId: PASSAGE_ID, quotedText: '첫 번째 대목 인용문', isSpoiler: false },
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
}

/** index번째 흔적의 댓글 아이콘 */
function commentToggle(index: number) {
  const toggle = screen.getAllByRole('button', { name: '댓글 보기' })[index]
  if (!toggle) throw new Error(`댓글 보기 버튼 ${String(index)}번을 찾지 못했다`)
  return toggle
}

async function openFirstTraceComments() {
  await renderView()
  fireEvent.click(commentToggle(0))
  await screen.findByText('내가 쓴 댓글')
}

describe('흔적 댓글 인라인 펼침', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
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
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toHaveValue('')
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
})
