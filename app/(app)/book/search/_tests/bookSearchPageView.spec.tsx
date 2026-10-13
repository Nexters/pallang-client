import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookSearchPageView } from '../_components/BookSearchPageView/BookSearchPageView'

const routerMock = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}))

const { searchBooksMock, searchInternalBooksMock } = vi.hoisted(() => ({
  searchBooksMock: vi.fn(() =>
    Promise.resolve({
      data: {
        books: [
          {
            bookId: null,
            title: '프랑켄슈타인',
            author: '메리 셸리',
            publisher: '문학동네',
            coverImageUrl: null,
            isbn: '9788954609012',
          },
        ],
      },
    }),
  ),
  searchInternalBooksMock: vi.fn(() =>
    Promise.resolve({
      data: {
        books: [],
        pageInfo: { page: 0, hasNext: false },
      },
    }),
  ),
}))

vi.mock('next/navigation', () => ({ useRouter: () => routerMock }))
vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchBooks: searchBooksMock,
  searchInternalBooks: searchInternalBooksMock,
}))
vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
}))

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <BookSearchPageView />
    </QueryClientProvider>,
  )
}

describe('탐색 책 검색', () => {
  afterEach(() => {
    vi.useRealTimers()
    searchBooksMock.mockClear()
    searchInternalBooksMock.mockClear()
    routerMock.push.mockClear()
    routerMock.replace.mockClear()
    routerMock.back.mockClear()
  })

  it('내부 검색 결과가 없으면 안내 문구와 외부 검색 결과, 새 책 등록 링크를 보여준다', async () => {
    renderView()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '프랑켄슈타인' } })

    expect(
      await screen.findByText(/검색하신 책은 현재 팔랑에 남겨지지 않았어요/),
    ).toBeInTheDocument()
    expect(screen.getByText(/오탈자인지 먼저 확인해주시고/)).toBeInTheDocument()
    expect(screen.getByText(/아니라면 직접 첫 기록을 남겨주세요/)).toBeInTheDocument()
    expect(await screen.findByText('프랑켄슈타인')).toBeInTheDocument()
    expect(screen.getByText('문학동네 · 메리 셸리')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 책 등록하기' })).toBeInTheDocument()
    expect(screen.queryByText('등록된 책이 없어요!')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(searchInternalBooksMock).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: '프랑켄슈타인', size: 20 }),
      )
      expect(searchBooksMock).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: '프랑켄슈타인', size: 20 }),
      )
    })
  })

  it('새 책 등록하기를 누르면 책 추가 화면으로 이동한다', async () => {
    renderView()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '프랑켄슈타인' } })

    fireEvent.click(await screen.findByRole('button', { name: '새 책 등록하기' }))

    expect(routerMock.push).toHaveBeenCalledWith('/book/new')
  })

  it('외부 검색 결과를 누르면 책 추가 폼에 서지 정보를 채운다', async () => {
    renderView()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '프랑켄슈타인' } })

    fireEvent.click(await screen.findByRole('button', { name: /프랑켄슈타인/ }))

    expect(await screen.findByRole('heading', { name: '책 추가하기' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('프랑켄슈타인')).toBeInTheDocument()
    expect(screen.getByDisplayValue('메리 셸리')).toBeInTheDocument()
    expect(screen.getByDisplayValue('문학동네')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9788954609012')).toBeInTheDocument()
  })
})
