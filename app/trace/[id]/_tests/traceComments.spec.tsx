import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { TraceDetailOverlay } from '../_components/TraceDetailOverlay/TraceDetailOverlay'

const trace = {
  opinionId: 1,
  nickname: '밤의독서가',
  content: '흔적 본문',
  createdAt: '2026-07-27T00:00:00.000Z',
  likeCount: 3,
}

const commentBase = {
  isDeleted: false,
  createdAt: '2026-07-27T01:00:00.000Z',
  updatedAt: '2026-07-27T01:00:00.000Z',
}

function seedComments(): RootCommentResponse[] {
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
    {
      ...commentBase,
      commentId: 2,
      userId: 2,
      nickname: '다른사람',
      content: '남이 쓴 댓글',
      replies: [
        { ...commentBase, commentId: 3, userId: 2, nickname: '다른사람', content: '미리보기 답글' },
      ],
      replyCount: 6,
      hasMoreReplies: true,
    },
  ]
}

// 댓글 목록/작성/수정/삭제/답글 API를 상태를 가진 목으로 흉내낸다.
function stubCommentApi() {
  let comments = seedComments()
  let nextId = 100

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)))
      const parseBody = () => JSON.parse(options?.body as string) as { content: string }

      if (url.includes('/users/me')) {
        return json({ data: { userId: 10, nickname: '나' } })
      }
      if (url.includes('/opinions/1/comments')) {
        if (method === 'POST') {
          const { content } = parseBody()
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
          comments = [...comments, created]
          return json({ data: created })
        }
        return json({
          data: {
            comments,
            pageInfo: {
              page: 0,
              size: 100,
              totalElements: comments.length,
              totalPages: 1,
              hasNext: false,
            },
          },
        })
      }
      const repliesMatch = /\/comments\/(\d+)\/replies/.exec(url)
      if (repliesMatch) {
        const replies = Array.from({ length: 6 }, (_, i) => ({
          ...commentBase,
          commentId: 30 + i,
          userId: 2,
          nickname: '다른사람',
          content: `${String(i + 1)}번째 답글`,
        }))
        return json({
          data: {
            comments: replies,
            pageInfo: { page: 0, size: 100, totalElements: 6, totalPages: 1, hasNext: false },
          },
        })
      }
      const commentMatch = /\/comments\/(\d+)/.exec(url)
      if (commentMatch) {
        const commentId = Number(commentMatch[1])
        if (method === 'PATCH') {
          const { content } = parseBody()
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
      return json({ data: {} })
    }),
  )
}

function renderOverlay(
  runWithLogin: (action: () => void) => void = (action) => {
    action()
  },
) {
  stubCommentApi()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <TraceDetailOverlay
        trace={trace}
        index={0}
        count={1}
        quote="인용문"
        onNavigate={() => undefined}
        onClose={() => undefined}
        runWithLogin={runWithLogin}
      />
    </QueryClientProvider>,
  )
}

describe('TraceDetailOverlay 댓글', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('댓글 목록과 답글 미리보기를 API 응답으로 그린다', async () => {
    renderOverlay()

    expect(await screen.findByText('내가 쓴 댓글')).toBeInTheDocument()
    expect(screen.getByText('남이 쓴 댓글')).toBeInTheDocument()
    expect(screen.getByText('미리보기 답글')).toBeInTheDocument()
  })

  it('댓글을 등록하면 서버에 저장되고 목록이 갱신된다', async () => {
    renderOverlay()
    await screen.findByText('내가 쓴 댓글')

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    expect(await screen.findByText('새 댓글')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toHaveValue('')
  })

  it('수정·삭제 버튼은 본인 댓글에만 보인다', async () => {
    renderOverlay()
    await screen.findByText('남이 쓴 댓글')

    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(1)
  })

  it('본인 댓글을 수정할 수 있다', async () => {
    renderOverlay()
    await screen.findByText('내가 쓴 댓글')

    fireEvent.click(screen.getByRole('button', { name: '수정' }))
    fireEvent.change(screen.getByLabelText('댓글 수정 입력'), { target: { value: '고친 댓글' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('고친 댓글')).toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('본인 댓글을 삭제하면 삭제된 댓글로 표시된다', async () => {
    renderOverlay()
    await screen.findByText('내가 쓴 댓글')

    fireEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('삭제된 댓글입니다')).toBeInTheDocument()
    expect(screen.queryByText('내가 쓴 댓글')).not.toBeInTheDocument()
  })

  it('hasMoreReplies인 댓글은 답글 더보기로 전체 답글을 불러온다', async () => {
    renderOverlay()
    await screen.findByText('남이 쓴 댓글')

    fireEvent.click(screen.getByRole('button', { name: '답글 더보기' }))

    expect(await screen.findByText('6번째 답글')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '답글 더보기' })).not.toBeInTheDocument()
  })

  it('댓글 등록은 로그인 게이트를 거친다', async () => {
    // 게이트가 액션을 실행하지 않으면(비로그인) POST가 나가지 않아야 한다
    const runWithLogin = vi.fn()
    renderOverlay(runWithLogin)
    await screen.findByText('내가 쓴 댓글')

    fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요'), {
      target: { value: '새 댓글' },
    })
    fireEvent.click(screen.getByRole('button', { name: '댓글 등록' }))

    expect(runWithLogin).toHaveBeenCalledTimes(1)
    const postCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([, options]) => options?.method === 'POST')
    expect(postCalls).toHaveLength(0)
  })
})
