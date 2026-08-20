import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => routerMock, usePathname: () => '/' }))

const authState = vi.hoisted(() => ({
  status: 'authenticated',
}))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: vi.fn(),
  }),
}))

function renderTabScreen() {
  return render(
    <LoginGateProvider>
      <TabScreenLayout activeTab="home">본문</TabScreenLayout>
    </LoginGateProvider>,
  )
}

/** 모임 목록은 로그인 기반이다 — 비로그인 탭 이동은 빈 화면 대신 로그인 게이트로 막는다 */
describe('모임 탭 로그인 게이트', () => {
  afterEach(() => {
    vi.clearAllMocks()
    authState.status = 'authenticated'
  })

  it('비로그인이면 모임 탭 클릭에 이동 대신 로그인 게이트가 뜬다', () => {
    authState.status = 'unauthenticated'
    renderTabScreen()

    fireEvent.click(screen.getByRole('button', { name: '모임' }))

    expect(screen.getByText(LOGIN_GATE_MESSAGE.groupList)).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('로그인 상태면 모임 탭 클릭이 게이트 없이 /meeting으로 이동한다', () => {
    renderTabScreen()

    fireEvent.click(screen.getByRole('button', { name: '모임' }))

    expect(routerMock.push).toHaveBeenCalledWith('/meeting')
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.groupList)).not.toBeInTheDocument()
  })
})
