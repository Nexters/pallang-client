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

/** 같은 책을 모임과 개인 양쪽에서 남긴 서재 — 서버가 (책, 모임) 단위로 두 항목을 내려준다 */
const GROUP_ENTRY = { ...SAMPLE_BOOK, groupId: 13, groupName: '헤일메리 뽀개기', opinionCount: 3 }
const GLOBAL_ENTRY = { ...SAMPLE_BOOK, groupId: null, groupName: null }

function stubBookApiWithBooks(books: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            books,
            pageInfo: {
              page: 0,
              size: 10,
              totalElements: books.length,
              totalPages: 1,
              hasNext: false,
            },
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

  // 같은 bookId 두 장을 한 장으로 합치면(옛 dedupe) 모임 항목이 사라지고, 링크에 groupId가 없으면
  // 모임 전용 대목이 조회되지 않아 빈 흔적 화면이 된다(#420)
  it('같은 책의 모임 항목과 개인 항목을 따로 세우고, 모임 항목은 그 모임 흔적 화면으로 보낸다', async () => {
    stubBookApiWithBooks([GROUP_ENTRY, GLOBAL_ENTRY])
    renderCarousel(false)

    const groupLink = await screen.findByRole('link', {
      name: '프로젝트 헤일메리 흔적 보기 (모임: 헤일메리 뽀개기)',
    })
    expect(groupLink).toHaveAttribute('href', '/trace/226?groupId=13')
    expect(screen.getByRole('link', { name: '프로젝트 헤일메리 흔적 보기' })).toHaveAttribute(
      'href',
      '/trace/226',
    )
  })

  it('모임 항목 표지에만 모임 라벨을 단다', async () => {
    stubBookApiWithBooks([GROUP_ENTRY, GLOBAL_ENTRY])
    renderCarousel(false)

    expect(await screen.findAllByLabelText('모임 도서')).toHaveLength(1)
    expect(screen.queryByText('SAMPLE')).not.toBeInTheDocument()
  })

  it('가운데 선 책이 모임 항목이면 정보줄에 모임 이름을 보이고, 흔적 수 배지도 그 모임으로 보낸다', async () => {
    stubBookApiWithBooks([GROUP_ENTRY, GLOBAL_ENTRY])
    renderCarousel(false)

    expect(await screen.findByText('헤일메리 뽀개기')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '3개의 흔적 보기' })).toHaveAttribute(
      'href',
      '/trace/226?groupId=13',
    )
  })
})
