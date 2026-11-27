import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { MeetingBookEditView } from '../_components/MeetingBookEditView/MeetingBookEditView'

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))
vi.mock('@/app/_global/_apis/_generated/group-book/group-book', () => ({
  getGroupBooks: () =>
    Promise.resolve({
      data: {
        books: [
          {
            entryId: 5,
            bookId: 7,
            title: '모순',
            author: '양귀자',
            startDate: null,
            endDate: null,
            status: 'READING',
          },
        ],
        pageInfo: { hasNext: false },
      },
    }),
}))

describe('책 설정 변경', () => {
  it('책과 현재 상태를 보여주고 독서 상태를 선택한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <HardwareBackProvider>
          <MeetingBookEditView groupId={1} entryId={5} />
        </HardwareBackProvider>
      </QueryClientProvider>,
    )
    expect(await screen.findByText('모순')).toBeInTheDocument()
    expect(screen.getByText('선택한 책은 변경할 수 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '읽는 중' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: '완독' }))
    expect(screen.getByRole('radio', { name: '완독' })).toHaveAttribute('aria-checked', 'true')
  })
})
