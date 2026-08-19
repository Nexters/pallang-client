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

  it('로그인 사용자의 도서에는 SAMPLE 배지를 보여주지 않는다', async () => {
    stubBookApi()
    renderCarousel(false)

    expect(await screen.findByText('프로젝트 헤일메리')).toBeInTheDocument()
    expect(screen.queryByText('SAMPLE')).not.toBeInTheDocument()
  })
})
