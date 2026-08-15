import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookSearchSheet } from '../_components/BookSearchSheet/BookSearchSheet'

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchExternalBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

function renderSheet(onSelect = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <BookSearchSheet open onClose={vi.fn()} onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return onSelect
}

describe('책 검색 시트', () => {
  it('시트 안에서 뒤로 버튼과 검색창을 보여준다', async () => {
    renderSheet()

    expect(await screen.findByRole('button', { name: '뒤로' })).toBeTruthy()
    expect(screen.getByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('책을 고르는 것만으로는 확정되지 않는다', async () => {
    const onSelect = renderSheet()

    fireEvent.click(await screen.findByText('모순'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('고른 뒤 등록하기를 눌러야 확정된다', async () => {
    const onSelect = renderSheet()

    fireEvent.click(await screen.findByText('모순'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 7, title: '모순' }))
  })

  it('아무것도 고르지 않으면 등록하기가 눌리지 않는다', async () => {
    renderSheet()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    expect(screen.getByRole('button', { name: '등록하기' }).hasAttribute('disabled')).toBe(true)
  })
})
