import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MeetingDetailView } from '../_components/MeetingDetailView/MeetingDetailView'

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true, status: 'authenticated' }),
}))
vi.mock('@/app/_global/_apis/_generated/group/group', () => ({
  getGroupDetail: () =>
    Promise.resolve({ data: { name: '고전 모임', memberCount: 5, capacity: 10 } }),
}))
const getGroupBooks = vi.hoisted(() => vi.fn())
vi.mock('@/app/_global/_apis/_generated/group-book/group-book', () => ({ getGroupBooks }))

describe('모임 상세', () => {
  it('모임 정보를 불러와 이름과 인원을 표시한다', async () => {
    getGroupBooks.mockImplementation((_id: number, params: { status?: string }) =>
      Promise.resolve({
        data: {
          status: params.status ?? 'FINISHED',
          readingCount: 1,
          finishedCount: 1,
          books: [
            {
              entryId: params.status === 'READING' ? 2 : 1,
              bookId: 1,
              title: params.status === 'READING' ? '읽는 책' : '완독 책',
              author: '작가',
              passageCount: 1,
              opinionCount: 2,
            },
          ],
          pageInfo: { page: 0, hasNext: false },
        },
      }),
    )
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MeetingDetailView groupId={1} />
      </QueryClientProvider>,
    )
    expect(screen.getByRole('heading', { name: '모임' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '고전 모임' })).toBeInTheDocument()
    expect(screen.getByText('멤버 5 / 10명')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '멤버 보기' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('button', { name: '+ 함께 읽을 책 추가' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    const finished = await screen.findByRole('radio', { name: '완독한 책 1' })
    expect(finished).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('완독 책')).toBeInTheDocument()
    expect(getGroupBooks).toHaveBeenCalledWith(1, { page: 0, size: 20 })
    fireEvent.click(screen.getByRole('radio', { name: '함께 읽는 책 1' }))
    await waitFor(() => {
      expect(getGroupBooks).toHaveBeenCalledWith(1, { status: 'READING', page: 0, size: 20 })
    })
    expect(await screen.findByText('읽는 책')).toBeInTheDocument()
    expect(screen.queryByText('완독 책')).not.toBeInTheDocument()
  })
})
