import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LikedOpinionsView } from '../_components/LikedOpinionsView/LikedOpinionsView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const OPINION = {
  opinionId: 11,
  bookId: 3,
  bookTitle: '모순',
  author: '양귀자',
  bookCoverImageUrl: null,
  passageId: 91,
  quotedText: '책장 냄새가 이렇게',
  pageNumber: 128,
  content: '두꺼운 책을 멀리한지 꽤 되어서 걱정됬는데, 걱정이 무색할 정도로 술술 읽혔습니다.',
  nickname: '밤샘낭독가',
  likeCount: 4,
  createdAt: '2026-08-01T00:00:00Z',
  likedAt: '2026-08-02T00:00:00Z',
}

const BOOKS = [
  { bookId: 3, title: '모순' },
  { bookId: 5, title: '만조를 기다리며' },
]

/** 오간 요청 url을 순서대로 담는다 — 필터·토글이 실제로 서버까지 갔는지 여기서 본다 */
function stubApi(opinions: (typeof OPINION)[] = [OPINION]) {
  const requests: { url: string; method: string }[] = []
  // 서버처럼 토글이 상태를 뒤집어야 되돌리기까지 이어서 볼 수 있다
  let liked = true

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method ?? 'GET' })

      if (url.includes('/api/opinions/') && url.endsWith('/like')) {
        liked = !liked
        return Promise.resolve(
          new Response(
            JSON.stringify({ data: { liked, likeCount: liked ? OPINION.likeCount : 3 } }),
          ),
        )
      }
      if (url.includes('/filter-books')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { books: BOOKS } })))
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              opinions,
              pageInfo: {
                page: 0,
                size: 20,
                totalElements: opinions.length,
                totalPages: 1,
                hasNext: false,
              },
            },
          }),
        ),
      )
    }),
  )

  return requests
}

function renderView(opinions?: (typeof OPINION)[]) {
  const requests = stubApi(opinions)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <LikedOpinionsView />
    </QueryClientProvider>,
  )
  return requests
}

/** 좋아요 목록 요청만 골라 본다 — 도서 필터 요청과 토글 요청이 섞여 들어온다 */
function likedListUrls(requests: { url: string; method: string }[]) {
  return requests.filter((request) => request.url.includes('/me/likes')).map(({ url }) => url)
}

describe('좋아요 관리', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('셸(제목·도서 필터)은 목록을 기다리지 않고 먼저 선다', () => {
    renderView()

    expect(screen.getByRole('heading', { name: '좋아요 관리' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '도서 필터' })).toBeInTheDocument()
  })

  it('좋아요가 하나도 없으면 빈 상태 문구를 보여준다', async () => {
    renderView([])

    expect(await screen.findByText('등록한 좋아요가 없습니다')).toBeInTheDocument()
  })

  it('도서 필터에서 책을 고르면 그 bookId로 목록을 다시 불러온다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    // base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다 — userEvent로 조작해야 한다
    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    await waitFor(() => {
      expect(likedListUrls(requests).some((url) => url.includes('bookId=5'))).toBe(true)
    })
  })

  it('도서 필터 옵션은 서버가 준 순서 그대로 전부 나온다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))

    const options = await screen.findAllByRole('option')
    // 고른 값('전체 책 보기')은 목록에서 빠지고 나머지가 서버 순서대로 남는다
    expect(options.map((option) => option.textContent)).toEqual(['모순', '만조를 기다리며'])
  })

  it('하트를 끄면 좋아요 해제를 요청하고 되돌릴 수 있는 스낵바를 띄운다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    const heart = screen.getByRole('button', { name: '좋아요' })
    expect(heart).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(heart)

    expect(await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'false')
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(1)
  })

  it('스낵바의 취소를 누르면 좋아요를 다시 켜고 안내가 닫힌다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '좋아요' })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(2)
  })

  it('해제한 카드는 목록에 그대로 남는다 — 되돌릴 자리가 사라지면 안 된다', async () => {
    renderView()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    expect(screen.getByText(OPINION.content)).toBeInTheDocument()
  })

  it('카드를 누르면 그 흔적이 열린 흔적 보기로 간다 — 시안에 어피던스는 없지만 경로는 남는다', async () => {
    renderView()
    await screen.findByText(OPINION.content)

    expect(screen.getByRole('link', { name: '밤샘낭독가님의 흔적 보기' })).toHaveAttribute(
      'href',
      '/trace/3?page=128&passageId=91&opinionId=11',
    )
  })
})
