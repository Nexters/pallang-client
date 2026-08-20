import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/app/_global/_data/api.model'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingInviteView } from '../_components/MeetingInviteView/MeetingInviteView'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => routerMock }))

const authState = vi.hoisted(() => ({ status: 'authenticated' }))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: vi.fn(),
  }),
}))

const previewInvitation = vi.hoisted(() => vi.fn())
const joinGroup = vi.hoisted(() => vi.fn())
vi.mock('@/app/_global/_apis/_generated/group/group', () => ({ previewInvitation, joinGroup }))

const INVITE_CODE = 'abc123'

const preview = {
  groupId: 1,
  name: '고전 뽀개기',
  bookTitle: '모순',
  bookAuthor: '양귀자',
  bookCoverImageUrl: null,
  capacity: 6,
  memberCount: 3,
  full: false,
  alreadyJoined: false,
}

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <LoginGateProvider>
        <MeetingInviteView inviteCode={INVITE_CODE} />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

afterEach(() => {
  previewInvitation.mockReset()
  joinGroup.mockReset()
  routerMock.replace.mockReset()
  authState.status = 'authenticated'
  window.sessionStorage.clear()
})

describe('초대 링크 랜딩', () => {
  it('모임·책·인원을 보여주고 참여 CTA를 연다', async () => {
    previewInvitation.mockResolvedValue({ data: preview })
    renderView()

    expect(await screen.findByText('고전 뽀개기')).toBeInTheDocument()
    expect(screen.getByText('모순 · 양귀자')).toBeInTheDocument()
    expect(screen.getByText('참여 인원 3/6명')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeEnabled()
    expect(previewInvitation).toHaveBeenCalledWith(INVITE_CODE)
  })

  it('정원이 가득 차면 CTA가 잠기고 이유를 함께 보여준다', async () => {
    previewInvitation.mockResolvedValue({ data: { ...preview, memberCount: 6, full: true } })
    renderView()

    expect(await screen.findByText('정원이 가득 차 참여할 수 없어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeDisabled()
  })

  it('이미 참여한 모임이면 참여 대신 모임 탭으로 보낸다', async () => {
    previewInvitation.mockResolvedValue({ data: { ...preview, alreadyJoined: true } })
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: '모임 탭으로 가기' }))

    expect(routerMock.replace).toHaveBeenCalledWith('/meeting')
    expect(joinGroup).not.toHaveBeenCalled()
  })

  it('참여에 성공하면 목록 캐시를 비우고 알림을 남긴 채 모임 탭으로 간다', async () => {
    previewInvitation.mockResolvedValue({ data: preview })
    joinGroup.mockResolvedValue({ data: { groupId: 1 } })
    const queryClient = renderView()
    // 옛 목록이 남으면 /meeting이 방금 참여한 모임이 빠진 캐시로 먼저 그려진다
    queryClient.setQueryData(groupQueries.list().queryKey, { pageParams: [0], pages: [] })

    fireEvent.click(await screen.findByRole('button', { name: '모임 참여하기' }))

    await waitFor(() => {
      expect(joinGroup).toHaveBeenCalledWith(INVITE_CODE)
    })
    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith('/meeting')
    })
    expect(window.sessionStorage.getItem('pallang.meetingNotice')).toBe('joined')
    expect(queryClient.getQueryData(groupQueries.list().queryKey)).toBeUndefined()
  })

  it('마지막 자리가 방금 찼으면(409) 안내 스낵바', async () => {
    previewInvitation.mockResolvedValue({ data: preview })
    joinGroup.mockRejectedValue(new ApiError(409, 'GROUP_409_3', '모임 정원이 가득 찼습니다.'))
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: '모임 참여하기' }))

    expect(await screen.findByText('정원이 가득 차 참여할 수 없어요.')).toBeInTheDocument()
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('없는 초대 코드(404)는 모임 탭으로 빠져나갈 길만 준다', async () => {
    previewInvitation.mockRejectedValue(
      new ApiError(404, 'GROUP_404_2', '유효하지 않은 초대 코드입니다.'),
    )
    renderView()

    expect(await screen.findByText('유효하지 않은 초대 링크예요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '모임 참여하기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '모임 탭으로 가기' }))
    expect(routerMock.replace).toHaveBeenCalledWith('/meeting')
  })

  it('비로그인은 게이트로 막고, 로그인 뒤 이 초대로 돌아올 자리를 심는다', async () => {
    authState.status = 'unauthenticated'
    previewInvitation.mockResolvedValue({ data: preview })
    renderView()

    // 비로그인도 모임은 볼 수 있어야 초대가 초대다
    expect(await screen.findByText('고전 뽀개기')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '모임 참여하기' }))

    expect(await screen.findByText('로그인하면 모임에 참여할 수 있어요!')).toBeInTheDocument()
    expect(joinGroup).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem('pallang.postLoginReturnPath')).toBe(
      `/meeting/invite/${INVITE_CODE}`,
    )
  })
})
