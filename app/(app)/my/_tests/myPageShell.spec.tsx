import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { MyPageContent } from '../_components/MyPageContent/MyPageContent'
import { MyPageView } from '../_components/MyPageView/MyPageView'

const { authState } = vi.hoisted(() => ({
  authState: { status: 'loading' },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: vi.fn(),
  }),
}))

function renderWith(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>{children}</LoginGateProvider>
    </QueryClientProvider>,
  )
}

/** 셸이 살아 있으면 헤더와 탭바 항목이 함께 잡힌다 */
function queryShell() {
  return [
    screen.queryByRole('heading', { name: '마이페이지' }),
    screen.queryByRole('link', { name: 'home' }),
    screen.queryByRole('button', { name: '흔적 남기기' }),
  ]
}

describe('마이페이지 셸', () => {
  beforeEach(() => {
    authState.status = 'loading'
  })

  // 예전에는 인증 판별이 끝날 때까지 null을 반환해 탭바까지 사라졌고,
  // 루트 배경(bg-bg-dark)이 드러나면서 화면이 번쩍였다.
  it('인증 판별 전에도 셸과 헤더가 화면에 남는다', () => {
    renderWith(<MyPageContent />)

    expect(queryShell().every(Boolean)).toBe(true)
  })

  it('비로그인이 확정되면 로그인 유도 화면이 같은 셸 안에 들어선다', () => {
    authState.status = 'unauthenticated'
    renderWith(<MyPageContent />)

    expect(queryShell().every(Boolean)).toBe(true)
    expect(screen.getByText('안녕하세요!')).toBeInTheDocument()
  })

  it('로딩 중에는 로그인·비로그인 어느 쪽 내용도 먼저 보여주지 않는다', () => {
    // 판별 전에 비로그인 화면을 깔면 로그인 사용자에게 잘못된 화면이 스친다
    renderWith(<MyPageView user={null} isPending />)

    expect(queryShell().every(Boolean)).toBe(true)
    expect(screen.queryByText('안녕하세요!')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '로그아웃' })).not.toBeInTheDocument()
  })

  it('판별이 끝나면 골격 대신 실제 내용이 들어선다', () => {
    renderWith(
      <MyPageView
        user={{ nickname: '기록광', traceCount: 3, profileImageUrl: null }}
        isPending={false}
      />,
    )

    expect(screen.getByText('기록광')).toBeInTheDocument()
    expect(screen.getByText('지금까지 3개의 흔적을 남겼어요!')).toBeInTheDocument()
  })
})
