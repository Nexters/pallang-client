import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingEditView } from '../_components/MeetingEditView/MeetingEditView'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => routerMock }))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated', isAuthenticated: true, signOut: vi.fn() }),
}))
vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))
vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
}))

const getGroupDetail = vi.hoisted(() => vi.fn())
const updateGroup = vi.hoisted(() => vi.fn())
vi.mock('@/app/_global/_apis/_generated/group/group', () => ({ getGroupDetail, updateGroup }))

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AppBackProvider>
        <LoginGateProvider>
          <MeetingEditView groupId={1} />
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

afterEach(() => {
  getGroupDetail.mockReset()
  updateGroup.mockReset()
  routerMock.replace.mockReset()
  window.sessionStorage.clear()
})

const detail = {
  groupId: 1,
  name: '주말 독서 모임',
  bookId: 7,
  bookTitle: '모순',
  bookAuthor: '양귀자',
  bookCoverImageUrl: null,
  hostUserId: 1,
  hostNickname: '여백이',
  capacity: 4,
  memberCount: 3,
  startDate: '2026-08-20',
  endDate: '2026-08-22',
  ended: false,
}

describe('방 설정 변경', () => {
  it('불러오는 동안 제목은 남고 폼 자리만 골격이다', () => {
    getGroupDetail.mockReturnValue(new Promise(() => undefined))
    renderView() // <MeetingEditView groupId={1} />
    expect(screen.getByRole('heading', { name: '방 설정 변경' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '모임 정보를 불러오는 중' })).toBeInTheDocument()
  })
  it('상세로 폼을 채우고 책은 잠근 채 수정하기를 보낸다', async () => {
    getGroupDetail.mockResolvedValue({ data: detail })
    updateGroup.mockResolvedValue({ data: detail })
    const queryClient = renderView()
    // 옛 목록이 남으면 /meeting이 수정 전 값으로 먼저 그려진다
    queryClient.setQueryData(groupQueries.list().queryKey, { pageParams: [0], pages: [] })
    expect(await screen.findByDisplayValue('주말 독서 모임')).toBeInTheDocument()
    expect(screen.getByText('모순')).toBeInTheDocument()
    expect(screen.getByText('선택한 책은 변경할 수 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2026.08.20 ~ 2026.08.22/ })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/모임명/), { target: { value: '주말 독서' } })
    fireEvent.click(screen.getByRole('button', { name: '수정하기' }))
    await waitFor(() => {
      expect(updateGroup).toHaveBeenCalledWith(1, {
        name: '주말 독서',
        capacity: 4,
        startDate: '2026-08-20',
        endDate: '2026-08-22',
      })
    })
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/meeting')
    })
    expect(window.sessionStorage.getItem('pallang.meetingNotice')).toBe('updated')
    expect(queryClient.getQueryData(groupQueries.list().queryKey)).toBeUndefined()
  })
  it('현재 인원(3)보다 적은 정원은 고를 수 없다', async () => {
    getGroupDetail.mockResolvedValue({ data: detail })
    renderView()
    await screen.findByDisplayValue('주말 독서 모임')
    fireEvent.click(screen.getByRole('combobox', { name: '인원' }))
    expect(await screen.findByRole('option', { name: '2명' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
  it('모임장이 아니면(403) 안내 스낵바', async () => {
    const { ApiError } = await import('@/app/_global/_data/api.model')
    getGroupDetail.mockResolvedValue({ data: detail })
    updateGroup.mockRejectedValue(new ApiError(403, 'GROUP_403_1', '모임장만 수정할 수 있습니다.'))
    renderView()
    await screen.findByDisplayValue('주말 독서 모임')
    fireEvent.click(screen.getByRole('button', { name: '수정하기' }))
    expect(await screen.findByText('모임장만 수정할 수 있어요.')).toBeInTheDocument()
  })
})
