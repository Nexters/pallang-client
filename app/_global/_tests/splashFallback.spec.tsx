import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../_providers/AuthProvider/AuthProvider'

const { hideMock, initState } = vi.hoisted(() => ({
  hideMock: vi.fn(() => Promise.resolve()),
  // 응답이 오지 않는 초기화를 흉내 낸다 — 기본값은 영원히 pending
  initState: { promise: new Promise<void>(() => undefined) },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/app/_global/_services/authToken.service', () => ({
  hasTokens: () => false,
  subscribeAuthTokens: () => () => undefined,
}))

vi.mock('@/app/_global/_queries/auth.queries', () => ({
  initAuthSession: () => initState.promise,
  signOut: () => Promise.resolve(),
}))

vi.mock('@/app/_global/_services/splashScreen.service', () => ({
  hideSplashScreen: hideMock,
}))

describe('스플래시 폴백', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    hideMock.mockClear()
    initState.promise = new Promise<void>(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('인증 초기화 응답이 오지 않아도 5초 뒤 스플래시를 내린다', () => {
    render(<AuthProvider>{null}</AuthProvider>)

    expect(hideMock).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(hideMock).toHaveBeenCalled()
  })

  it('초기화가 실패로 끝나도 스플래시를 내리고 unhandled rejection을 남기지 않는다', async () => {
    initState.promise = Promise.reject(new Error('network'))
    render(<AuthProvider>{null}</AuthProvider>)

    await act(async () => {
      await Promise.resolve()
    })

    expect(hideMock).toHaveBeenCalled()
  })
})
