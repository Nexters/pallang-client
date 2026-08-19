import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HomeOpinionList } from '../_components/HomeOpinionList/HomeOpinionList'

const PAGE_INFO = { page: 0, size: 20, totalElements: 4, totalPages: 1, hasNext: false }

const OPINIONS = [
  {
    opinionId: 1,
    bookId: 11,
    bookTitle: '모순',
    author: '양귀자',
    bookCoverImageUrl: null,
    passageId: 101,
    quotedText: '고요한 문장',
    pageNumber: 12,
    content: '첫 번째 의견입니다.',
    likeCount: 3,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    opinionId: 2,
    bookId: 12,
    bookTitle: '작별하지 않는다',
    author: '한강',
    bookCoverImageUrl: null,
    passageId: 102,
    quotedText: '눈 내리는 밤',
    pageNumber: 34,
    content: '두 번째 의견입니다.',
    likeCount: 4,
    createdAt: '2026-08-11T00:00:00Z',
  },
  {
    opinionId: 3,
    bookId: 13,
    bookTitle: '밝은 밤',
    author: '최은영',
    bookCoverImageUrl: null,
    passageId: 103,
    quotedText: '밝게 남은 밤',
    pageNumber: 56,
    content: '세 번째 의견입니다.',
    likeCount: 5,
    createdAt: '2026-08-12T00:00:00Z',
  },
  {
    opinionId: 4,
    bookId: 14,
    bookTitle: '여름은 오래 그곳에 남아',
    author: '마쓰이에 마사시',
    bookCoverImageUrl: null,
    passageId: 104,
    quotedText: '오래 남은 계절',
    pageNumber: 78,
    content: '네 번째 의견입니다.',
    likeCount: 6,
    createdAt: '2026-08-13T00:00:00Z',
  },
]

function createOpinion(index: number) {
  const baseOpinion = OPINIONS[index % OPINIONS.length]
  if (!baseOpinion) throw new Error('테스트 의견 기본값이 없습니다.')

  return {
    ...baseOpinion,
    opinionId: index + 1,
    bookId: 100 + index,
    bookTitle: `${String(index + 1)}번째 책`,
    passageId: 200 + index,
    pageNumber: 10 + index,
    content: `${String(index + 1)}번째 의견입니다.`,
    createdAt: `2026-08-${String(10 + index).padStart(2, '0')}T00:00:00Z`,
  }
}

function stubApi(opinions = OPINIONS) {
  const calls: string[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      calls.push(url)

      return Promise.resolve(
        new Response(JSON.stringify({ data: { opinions, pageInfo: PAGE_INFO } })),
      )
    }),
  )

  return calls
}

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={client}>
      <HomeOpinionList />
    </QueryClientProvider>,
  )
}

describe('홈 내 의견 목록', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('내 의견 API로 받아온 의견 카드를 최신순으로 보여준다', async () => {
    const calls = stubApi()
    renderList()

    expect(await screen.findByText('첫 번째 의견입니다.')).toBeInTheDocument()
    expect(screen.getByText('26.08.10')).toBeInTheDocument()
    expect(calls.some((url) => url.includes('/api/users/me/opinions?page=0&size=20'))).toBe(true)
  })

  it('카드 배경색을 Figma 배치대로 yellow, gray, white 순서로 반복한다', async () => {
    stubApi()
    renderList()

    const cards = await screen.findAllByRole('link')

    expect(cards[0]).toHaveClass('bg-[#f7eecb]')
    expect(cards[1]).toHaveClass('bg-[#404040]')
    expect(cards[2]).toHaveClass('bg-bg-default')
    expect(cards[3]).toHaveClass('bg-[#f7eecb]')
  })

  it('6개를 넘는 의견도 이어서 렌더한다', async () => {
    stubApi(Array.from({ length: 9 }, (_, index) => createOpinion(index)))
    renderList()

    expect(await screen.findByText('9번째 의견입니다.')).toBeInTheDocument()
  })

  it('의견이 없으면 빈 상태를 보여준다', async () => {
    stubApi([])
    renderList()

    expect(await screen.findByText('아직 남긴 의견이 없어요')).toBeInTheDocument()
  })
})
