import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../_providers/AuthProvider/AuthProvider'

const { replaceMock, hideMock, tokenState, listeners } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  hideMock: vi.fn(() => Promise.resolve()),
  tokenState: { hasTokens: true, initPromise: Promise.resolve() },
  listeners: new Set<() => void>(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}))

vi.mock('@/app/_global/_services/authToken.service', () => ({
  hasTokens: () => tokenState.hasTokens,
  subscribeAuthTokens: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}))

vi.mock('@/app/_global/_queries/auth.queries', () => ({
  initAuthSession: () => tokenState.initPromise,
  signOut: () => Promise.resolve(),
}))

vi.mock('@/app/_global/_services/splashScreen.service', () => ({
  hideSplashScreen: hideMock,
}))

function emitTokenChange() {
  act(() => {
    listeners.forEach((listener) => {
      listener()
    })
  })
}

describe('AuthProvider 세션 만료 처리', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    hideMock.mockClear()
    listeners.clear()
    tokenState.hasTokens = true
    tokenState.initPromise = Promise.resolve()
  })

  it('로그인 상태였다가 토큰이 사라지면 로그인 화면으로 보낸다', async () => {
    render(<AuthProvider>{null}</AuthProvider>)
    await act(() => Promise.resolve())

    tokenState.hasTokens = false
    emitTokenChange()

    expect(replaceMock).toHaveBeenCalledWith('/login')
  })

  it('처음부터 비로그인이면 리다이렉트하지 않는다', async () => {
    tokenState.hasTokens = false
    render(<AuthProvider>{null}</AuthProvider>)
    await act(() => Promise.resolve())

    emitTokenChange()

    expect(replaceMock).not.toHaveBeenCalled()
  })

  // 초기화가 실패로 끝나면 status가 'loading'에 머물러 화면이 골격으로 남았었다.
  // 응답이 영영 오지 않는 경우의 상한은 네이티브(launchShowDuration)가 맡으므로 여기서 다루지 않는다.
  it('초기화가 실패해도 저장된 토큰 기준으로 상태를 정하고 스플래시를 내린다', async () => {
    tokenState.hasTokens = false
    tokenState.initPromise = Promise.reject(new Error('network'))
    render(<AuthProvider>{null}</AuthProvider>)
    await act(() => Promise.resolve())

    expect(hideMock).toHaveBeenCalled()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
