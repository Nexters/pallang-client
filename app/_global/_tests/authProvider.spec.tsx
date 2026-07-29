import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../_providers/AuthProvider/AuthProvider'

const { replaceMock, tokenState, listeners } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  tokenState: { hasTokens: true },
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
  initAuthSession: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
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
    listeners.clear()
    tokenState.hasTokens = true
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
})
