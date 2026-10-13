import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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

function stubBookApiWithCovers(count: number) {
  const books = Array.from({ length: count }, (_, index) => ({
    ...SAMPLE_BOOK,
    bookId: 1000 + index,
    title: `표지 검증 도서 ${String(index)}`,
    coverImageUrl: `https://image.aladin.co.kr/product/1/2/cover500/test${String(index)}.jpg`,
  }))

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            books,
            pageInfo: { page: 0, size: 10, totalElements: count, totalPages: 1, hasNext: false },
          },
        }),
      ),
    ),
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

  // 캐러셀은 좌우로 다 훑는 지면이라 표지를 전량 즉시 로드한다 — lazy가 되살아나면
  // 스와이프로 드러나는 표지가 placeholder 뒤에 늦게 뜨는 깜빡임이 재발한다(#336).
  it('모든 표지 이미지를 lazy 없이 즉시 로드한다', async () => {
    stubBookApiWithCovers(5)
    renderCarousel(false)

    await screen.findByText('표지 검증 도서 0')
    const covers = document.querySelectorAll('img')
    expect(covers.length).toBe(5)
    covers.forEach((img) => {
      expect(img).not.toHaveAttribute('loading', 'lazy')
    })
  })

  it('로그인 사용자의 도서에는 SAMPLE 배지를 보여주지 않는다', async () => {
    stubBookApi()
    renderCarousel(false)

    expect(await screen.findByText('프로젝트 헤일메리')).toBeInTheDocument()
    expect(screen.queryByText('SAMPLE')).not.toBeInTheDocument()
  })
})
