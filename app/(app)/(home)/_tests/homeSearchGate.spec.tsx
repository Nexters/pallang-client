import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { notificationQueries } from '@/app/_global/_queries/notification.queries'
import {
  consumeAppInstallPrompt,
  markAppInstallPromptPending,
} from '@/app/_shared/onboarding/_services/appInstallPrompt.service'
import {
  markHomeCoachMarkPending,
  shouldShowHomeCoachMark,
} from '@/app/_shared/onboarding/_services/homeCoachMark.service'

import { HomePageView } from '../_components/HomePageView/HomePageView'

const { authState, getMobileWebPlatformMock, prefetchMock, pushMock } = vi.hoisted(() => ({
  authState: { isAuthenticated: false },
  getMobileWebPlatformMock: vi.fn(),
  prefetchMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('@/app/_global/_services/mobileWebPlatform.service', () => ({
  getMobileWebPlatform: getMobileWebPlatformMock,
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
function renderHome(hasUnread = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(notificationQueries.hasUnread().queryKey, {
    data: { hasUnread },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <HomePageView />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

describe('홈 검색 게이트', () => {
  beforeEach(() => {
    window.localStorage.clear()
    authState.isAuthenticated = false
    getMobileWebPlatformMock.mockReturnValue('ios')
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

  it('비로그인 사용자에게는 알림함 버튼이 보이지 않는다', async () => {
    renderHome()

    await screen.findByRole('button', { name: '검색' })
    expect(screen.queryByRole('button', { name: '알림함' })).not.toBeInTheDocument()
  })

  it('로그인 사용자가 알림함 버튼을 누르면 알림함 화면으로 이동한다', async () => {
    authState.isAuthenticated = true
    renderHome()

    await userEvent.click(await screen.findByRole('button', { name: '알림함' }))

    expect(pushMock).toHaveBeenCalledWith('/notifications')
  })

  it('읽지 않은 알림이 있으면 홈 벨에 새 알림 점을 보여준다', async () => {
    authState.isAuthenticated = true
    renderHome(true)

    expect(await screen.findByLabelText('새 알림')).toBeVisible()
  })

  it('읽지 않은 알림이 없으면 홈 벨에 새 알림 점을 숨긴다', async () => {
    authState.isAuthenticated = true
    renderHome()

    await screen.findByRole('button', { name: '알림함' })
    expect(screen.queryByLabelText('새 알림')).not.toBeInTheDocument()
  })

  it('온보딩 직후 홈 코치마크를 3단계로 보여주고 완료하면 앱 설치 안내를 띄운다', async () => {
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

    const appInstallDialog = await screen.findByRole('dialog', {
      name: '팔랑 앱에서 함께 읽어보세요',
    })
    expect(appInstallDialog).toHaveAccessibleDescription(
      '앱에서 다른 독자들의 생각을 읽고,\n나의 생각도 남겨보세요.',
    )
    expect(screen.getByRole('button', { name: '웹에서 계속보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '앱으로 열기' })).toBeInTheDocument()
  })

  it('온보딩을 건너뛰면 홈에서 앱 설치 안내를 띄운다', async () => {
    markAppInstallPromptPending()
    renderHome()

    expect(
      await screen.findByRole('dialog', { name: '팔랑 앱에서 함께 읽어보세요' }),
    ).toBeInTheDocument()
  })

  it('앱에서 온보딩을 건너뛰면 설치 안내를 띄우지 않는다', async () => {
    getMobileWebPlatformMock.mockReturnValue(null)
    markAppInstallPromptPending()
    renderHome()

    await waitFor(() => {
      expect(consumeAppInstallPrompt()).toBe(false)
    })

    expect(screen.queryByRole('dialog', { name: '팔랑 앱에서 함께 읽어보세요' })).toBeNull()
  })
})
