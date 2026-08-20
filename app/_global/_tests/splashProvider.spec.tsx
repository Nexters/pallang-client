import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

import { SplashProvider } from '../_providers/SplashProvider/SplashProvider'

const SPLASH_TAGLINE = '흔적을 넘기면, 다른 생각이 팔랑'

type MockAuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

const { authState } = vi.hoisted(() => {
  const state: { status: MockAuthStatus } = { status: 'loading' }
  return { authState: state }
})

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: () => Promise.resolve(),
  }),
}))

function getSplashRoot() {
  return screen.getByText(SPLASH_TAGLINE).closest('[data-state]')
}

describe('SplashProvider 해제 시점', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    authState.status = 'loading'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('인증 판정 중에는 스플래시가 화면을 덮고, 아래에는 다음 화면이 이미 그려져 있다', () => {
    render(
      <SplashProvider>
        <p>다음 화면</p>
      </SplashProvider>,
    )

    expect(getSplashRoot()).toHaveAttribute('data-state', 'open')
    // 스플래시가 걷히는 동안 드러날 화면 — 분기 바깥에서 항상 렌더돼 있어야 빈 화면이 없다
    expect(screen.getByText('다음 화면')).toBeInTheDocument()
  })

  // 구현이 최소 노출 타이머(구 MIN_SPLASH_MS)를 되살리면 이 시점의 상태가 'open'으로 남아 실패한다
  it('인증 판정이 끝나면 최소 노출 대기 없이 즉시 퇴장을 시작한다', () => {
    const { rerender } = render(
      <SplashProvider>
        <p>다음 화면</p>
      </SplashProvider>,
    )

    authState.status = 'unauthenticated'
    rerender(
      <SplashProvider>
        <p>다음 화면</p>
      </SplashProvider>,
    )

    // 타이머를 전혀 돌리지 않았다 — 판정 직후 렌더에서 곧바로 퇴장 상태여야 한다
    expect(getSplashRoot()).toHaveAttribute('data-state', 'exiting')
  })

  it('퇴장 전환이 끝날 때까지는 스플래시가 남아 있다가, 끝나면 내려간다', () => {
    const { rerender } = render(
      <SplashProvider>
        <p>다음 화면</p>
      </SplashProvider>,
    )

    authState.status = 'authenticated'
    rerender(
      <SplashProvider>
        <p>다음 화면</p>
      </SplashProvider>,
    )

    // 전환이 끝나기 직전까지는 페이드 중인 스플래시가 화면을 채운다 — 루트 배경이 드러날 틈이 없다
    act(() => {
      vi.advanceTimersByTime(MOTION_DURATION.normal - 1)
    })
    expect(screen.getByText(SPLASH_TAGLINE)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByText(SPLASH_TAGLINE)).not.toBeInTheDocument()
    expect(screen.getByText('다음 화면')).toBeInTheDocument()
  })
})
