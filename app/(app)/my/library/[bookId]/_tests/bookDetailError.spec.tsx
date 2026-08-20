import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BookDetailView } from '../_components/BookDetailView/BookDetailView'

const { notFoundMock } = vi.hoisted(() => ({ notFoundMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  // 실제로는 렌더를 끊고 not-found 화면으로 간다 — 여기서는 불렸는지만 본다
  notFound: notFoundMock,
}))

const BOOK_ID = 12

const BOOK = {
  bookId: BOOK_ID,
  title: '모순',
  author: '양귀자',
  publisher: '쓰다',
  pageCount: 300,
  coverImageUrl: null,
  passageCount: 6,
  opinionCount: 17,
}

const LIKED_OPINION = {
  opinionId: 21,
  bookId: BOOK_ID,
  bookTitle: '모순',
  author: '양귀자',
  bookCoverImageUrl: null,
  passageId: 91,
  quotedText: '책장 냄새가 이렇게',
  pageNumber: 128,
  content: '남이 남긴 흔적입니다.',
  likeCount: 4,
  createdAt: '2026-08-10T00:00:00Z',
  nickname: '밤샘낭독가',
  likedAt: '2026-08-02T00:00:00Z',
}

const PAGE_INFO = { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false }

type Options = {
  /** 책 상세가 돌려줄 상태 코드. 앞에서부터 한 번씩 쓰고, 다 쓰면 마지막 값을 계속 쓴다 */
  detailStatuses?: number[]
  saveStatusCode?: number
  liked?: (typeof LIKED_OPINION)[]
}

function stubApi({ detailStatuses = [200], saveStatusCode = 200, liked = [] }: Options) {
  const requests: string[] = []
  let detailCalls = 0
  let isLiked = true

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      requests.push(url)

      if (url.includes('/me/book-status')) {
        return Promise.resolve(new Response('{}', { status: saveStatusCode }))
      }
      if (url.includes('/api/opinions/') && url.endsWith('/like')) {
        isLiked = !isLiked
        return Promise.resolve(
          new Response(JSON.stringify({ data: { liked: isLiked, likeCount: isLiked ? 4 : 3 } })),
        )
      }
      if (url.includes('/me/likes')) return listResponse({ opinions: liked })
      if (url.includes('/me/')) return listResponse({ opinions: [], passages: [] })

      const status = detailStatuses[Math.min(detailCalls, detailStatuses.length - 1)] ?? 200
      detailCalls += 1
      if (status !== 200) return Promise.resolve(new Response('{}', { status }))
      return Promise.resolve(new Response(JSON.stringify({ data: BOOK })))
    }),
  )

  return requests
}

function listResponse(payload: Record<string, unknown>) {
  return Promise.resolve(
    new Response(JSON.stringify({ data: { ...payload, pageInfo: PAGE_INFO } })),
  )
}

function renderView(options: Options = {}) {
  const requests = stubApi(options)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BookDetailView bookId={BOOK_ID} />
    </QueryClientProvider>,
  )
  return requests
}

describe('책 상세 조회 실패', () => {
  beforeEach(() => {
    notFoundMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('책 머리를 못 불러오면 골격이 아니라 다시 부를 자리가 선다', async () => {
    renderView({ detailStatuses: [500] })

    expect(await screen.findByText('책 정보를 불러오지 못했어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument()
    // 4xx·5xx는 곧장 error로 정착한다 — 골격이 남으면 영원히 골격이다
    await waitFor(() => {
      expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(0)
    })
  })

  it('책 머리가 실패해도 셸(제목·뒤로 가기·탭)은 그대로 남는다', async () => {
    renderView({ detailStatuses: [500] })
    await screen.findByText('책 정보를 불러오지 못했어요')

    expect(screen.getByRole('heading', { name: '내 서재' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('다시 불러오기를 누르면 책 머리와 독서 상태 손잡이가 돌아온다', async () => {
    renderView({ detailStatuses: [500, 200] })

    await userEvent.click(await screen.findByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText('모순')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '독서 상태' })).toBeInTheDocument()
  })

  it('지워졌거나 볼 수 없는 책(404)은 not-found로 보낸다', async () => {
    renderView({ detailStatuses: [404] })

    await waitFor(() => {
      expect(notFoundMock).toHaveBeenCalled()
    })
  })

  it('404가 아닌 실패는 not-found로 보내지 않는다 — 다시 시도할 수 있는 실패다', async () => {
    renderView({ detailStatuses: [500] })
    await screen.findByText('책 정보를 불러오지 못했어요')

    expect(notFoundMock).not.toHaveBeenCalled()
  })

  it('새 안내가 뜨면 이전 안내를 걷는다 — 두 바가 같은 자리에 포개지지 않는다', async () => {
    renderView({ liked: [LIKED_OPINION], saveStatusCode: 500 })

    await userEvent.click(await screen.findByRole('tab', { name: '좋아요' }))
    await userEvent.click(await screen.findByRole('button', { name: '좋아요' }))
    expect(await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')).toBeInTheDocument()

    // 되돌릴 수 있는 3초 안에 독서 상태 저장이 실패한다 — 두 안내가 같은 자리를 노린다
    await userEvent.click(screen.getByRole('button', { name: '독서 상태' }))
    await userEvent.click(await screen.findByRole('radio', { name: '완독' }))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByText(/독서 상태를 저장하지 못했어요/)).toBeInTheDocument()
    // 앞선 안내는 남아 있지 않다 — 겹치면 아래에 깔린 쪽은 남은 수명 동안 누를 수 없다
    expect(screen.queryByText('밤샘낭독가님의 좋아요를 해제했어요')).not.toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })
})
