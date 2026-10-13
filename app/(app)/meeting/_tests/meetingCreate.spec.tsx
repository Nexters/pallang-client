import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingCreateView } from '../_components/MeetingCreateView/MeetingCreateView'

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
    Promise.resolve({
      data: {
        books: [
          {
            bookId: 7,
            title: '프랑켄슈타인',
            author: '메리 셸리',
            publisher: '문학동네',
            coverImageUrl: null,
            pageCount: 300,
          },
        ],
        pageInfo: { page: 0, hasNext: false },
      },
    }),
}))
vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
}))

// vi.mock 팩토리는 import보다 먼저(호이스팅되어) 실행된다 — 팩토리 안에서 참조할 목은
// vi.hoisted로 감싸야 "초기화 전 접근" 참조 오류 없이 값을 공유할 수 있다(bookSearchSheet.spec.tsx와 같은 선례).
// 기본 구현을 성공 응답으로 둬 vi.fn()의 반환 타입을 추론시킨다 — 이후 mockResolvedValue/mockRejectedValue가
// bare vi.fn()(Mock<Procedure>) 대신 타입 인지 상태로 호출된다.
const createGroup = vi.hoisted(() =>
  vi.fn(() => Promise.resolve<{ data: { groupId: number } }>({ data: { groupId: 1 } })),
)
vi.mock('@/app/_global/_apis/_generated/group/group', () => ({ createGroup }))

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <MeetingCreateView />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

async function fillForm() {
  // 달력은 이번 달을 연다 — 2026년 8월로 고정해야 달 이동 횟수가 안 바뀐다
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 7, 21))
  fireEvent.change(screen.getByLabelText(/모임명/), { target: { value: '고전 뽀개기' } })
  fireEvent.click(screen.getByRole('button', { name: /모임에서 읽을 책을 선택해주세요./ }))
  fireEvent.change(await screen.findByRole('searchbox'), { target: { value: '프랑켄' } })
  fireEvent.click(await screen.findByRole('button', { name: /프랑켄슈타인/ }))
  fireEvent.click(screen.getByRole('button', { name: '등록하기' }))
  fireEvent.click(screen.getByRole('button', { name: /시작일과 종료일을 선택해주세요./ }))
  fireEvent.click(await screen.findByRole('button', { name: '2026.08.20' }))
  fireEvent.click(screen.getByRole('button', { name: '다음 달' }))
  fireEvent.click(screen.getByRole('button', { name: '2026.09.20' }))
  fireEvent.click(screen.getByRole('button', { name: '확인' }))
}

afterEach(() => {
  vi.useRealTimers()
  createGroup.mockReset()
  routerMock.replace.mockReset()
  window.sessionStorage.clear()
})

describe('모임 만들기', () => {
  it('제목·CTA가 있고 다 채우기 전까지 CTA가 꺼져 있다', () => {
    renderView()
    expect(screen.getByRole('heading', { name: '모임 만들기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모임 만들기' })).toBeDisabled()
  })
  it('다 채우면 생성 요청을 보내고 목록으로 돌아가며 완료 표시를 남긴다', async () => {
    createGroup.mockResolvedValue({ data: { groupId: 1 } })
    const queryClient = renderView()
    // 목록에 옛 캐시를 심어 둔다 — 성공 뒤에도 남아 있으면 /meeting이 방금 만든 모임 없이 먼저 그려진다
    queryClient.setQueryData(groupQueries.list().queryKey, { pageParams: [0], pages: [] })
    await fillForm()
    const cta = screen.getByRole('button', { name: '모임 만들기' })
    await waitFor(() => {
      expect(cta).toBeEnabled()
    })
    fireEvent.click(cta)
    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith({
        name: '고전 뽀개기',
        bookId: 7,
        capacity: 2,
        startDate: '2026-08-20',
        endDate: '2026-09-20',
      })
    })
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/meeting')
    })
    expect(window.sessionStorage.getItem('pallang.meetingNotice')).toBe('created')
    expect(queryClient.getQueryData(groupQueries.list().queryKey)).toBeUndefined()
  })
  it('서버가 400을 주면 안내 스낵바를 띄우고 화면에 남는다', async () => {
    const { ApiError } = await import('@/app/_global/_data/api.model')
    createGroup.mockRejectedValue(new ApiError(400, 'GROUP_400_1', '시작일이 종료일보다 늦습니다.'))
    renderView()
    await fillForm()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '모임 만들기' })).toBeEnabled()
    })
    fireEvent.click(screen.getByRole('button', { name: '모임 만들기' }))
    expect(await screen.findByText('입력한 정보를 다시 확인해주세요.')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })
})
