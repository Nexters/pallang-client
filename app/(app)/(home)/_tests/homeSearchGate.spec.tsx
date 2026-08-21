import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import {
  markHomeCoachMarkPending,
  shouldShowHomeCoachMark,
} from '@/app/_shared/onboarding/_services/homeCoachMark.service'

import { HomePageView } from '../_components/HomePageView/HomePageView'

const { authState, prefetchMock, pushMock } = vi.hoisted(() => ({
  authState: { isAuthenticated: false },
  prefetchMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: prefetchMock }),
  usePathname: () => '/',
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authState.isAuthenticated,
    signOut: vi.fn(),
  }),
}))

vi.mock('../_hooks/useOnboardingGate', () => ({
  useOnboardingGate: vi.fn(),
}))

vi.mock('../_components/HomeSection/HomeSection', () => {
  return {
    HomeSection: ({ searchAction }: { searchAction?: ReactNode }) => {
      return <section aria-label="기록 중인 책 목록">{searchAction}책 목록</section>
    },
  }
})

// 코치마크가 하드웨어 back을 가져가므로 레지스트리가 있어야 한다
function renderHome() {
  return render(
    <AppBackProvider>
      <LoginGateProvider>
        <HomePageView />
      </LoginGateProvider>
    </AppBackProvider>,
  )
}

describe('홈 검색 게이트', () => {
  beforeEach(() => {
    window.localStorage.clear()
    authState.isAuthenticated = false
    prefetchMock.mockClear()
    pushMock.mockClear()
  })

  it('비로그인 사용자가 홈 검색 버튼을 누르면 로그인 모달을 띄우고 이동하지 않는다', async () => {
    renderHome()

    await userEvent.click(await screen.findByRole('button', { name: '검색' }))

    expect(pushMock).not.toHaveBeenCalledWith('/book/search/my-books')
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('로그인하면 확인 할 수 있어요!')
    expect(dialog).toHaveAccessibleDescription('팔랑과 함께하고 더 많은 의견을 확인해보세요.')
  })

  it('로그인 사용자가 홈 검색 버튼을 누르면 책 검색 화면으로 이동한다', async () => {
    authState.isAuthenticated = true
    renderHome()

    await userEvent.click(await screen.findByRole('button', { name: '검색' }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/book/search/my-books')
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('온보딩 직후 홈 코치마크를 3단계로 보여주고 완료하면 닫는다', async () => {
    markHomeCoachMarkPending()
    renderHome()

    expect(await screen.findByRole('dialog', { name: '홈 사용 안내' })).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByText('2/3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(screen.getByText('3/3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(screen.queryByRole('dialog', { name: '홈 사용 안내' })).not.toBeInTheDocument()
    expect(shouldShowHomeCoachMark()).toBe(false)
  })
})
