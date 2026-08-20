import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomeBookCarousel } from '../_components/HomeBookCarousel/HomeBookCarousel'

const SAMPLE_BOOK = {
  bookId: 226,
  title: '프로젝트 헤일메리',
  author: '메리 셸리',
  publisher: '팔랑출판',
  coverImageUrl: null,
  passageCount: 1,
  opinionCount: 100,
}

function buildBooksPage(startId: number, count: number, hasNext: boolean) {
  return new Response(
    JSON.stringify({
      data: {
        books: Array.from({ length: count }, (_, index) => ({
          ...SAMPLE_BOOK,
          bookId: startId + index,
          title: `페이지 도서 ${String(startId + index)}`,
        })),
        pageInfo: { page: 0, size: 10, totalElements: 12, totalPages: 2, hasNext },
      },
    }),
  )
}

function stubPagedBookApi() {
  let calls = 0
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      calls += 1
      return Promise.resolve(
        calls === 1 ? buildBooksPage(100, 10, true) : buildBooksPage(200, 2, false),
      )
    }),
  )
}

function stubBookApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            books: [SAMPLE_BOOK],
            pageInfo: { page: 0, size: 10, totalElements: 1, totalPages: 1, hasNext: false },
          },
        }),
      ),
    ),
  )
}

function renderCarousel(showSampleLabel: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <HomeBookCarousel showSampleLabel={showSampleLabel} />
    </QueryClientProvider>,
  )
}

describe('홈 내 서재 캐러셀', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('비로그인 샘플 도서에는 SAMPLE 배지를 보여준다', async () => {
    stubBookApi()
    renderCarousel(true)

    expect(await screen.findByText('SAMPLE')).toBeInTheDocument()
  })

  // append마다 스크롤을 복원하면 끝쪽을 보던 사용자가 초기 인덱스로 점프한다(#337).
  // 초기 정렬은 앞 2권만 스왑해 append 시 기존 인덱스가 그대로이므로 위치를 유지해야 한다.
  it('다음 페이지가 붙어도 보던 스크롤 위치를 유지한다', async () => {
    stubPagedBookApi()
    renderCarousel(false)

    await screen.findByLabelText('페이지 도서 100 흔적 보기')
    const scrollContainer = document.querySelector('[class*=snap-x]')
    if (!(scrollContainer instanceof HTMLElement)) throw new Error('scroll container not found')

    // 끝에서 두 번째 책(index 8, 책 간격 214px) 위치 — 여기서 다음 페이지 fetch가 시작된다
    const endScrollLeft = 8 * 214
    scrollContainer.scrollLeft = endScrollLeft
    fireEvent.scroll(scrollContainer)

    await screen.findByLabelText('페이지 도서 200 흔적 보기')
    expect(scrollContainer.scrollLeft).toBe(endScrollLeft)
  })

  it('로그인 사용자의 도서에는 SAMPLE 배지를 보여주지 않는다', async () => {
    stubBookApi()
    renderCarousel(false)

    expect(await screen.findByText('프로젝트 헤일메리')).toBeInTheDocument()
    expect(screen.queryByText('SAMPLE')).not.toBeInTheDocument()
  })
})
