// signInWithAppleToken 세션 브리지 검증 — 애플 로그인 성공 시 토큰 저장, 이상 응답 시 저장 없이 실패.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { loginWithApple } from '@/app/_global/_apis/_generated/auth/auth'
import type { LoginResponse } from '@/app/_global/_apis/_generated/models/loginResponse'
import { signInWithAppleToken } from '@/app/_global/_queries/auth.queries'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from '@/app/_global/_services/authToken.service'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ value: null }),
  },
}))

vi.mock('@/app/_global/_apis/_generated/auth/auth', () => ({
  agreeToTerms: vi.fn(),
  loginWithApple: vi.fn(),
  loginWithKakao: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}))

const loginData: LoginResponse = {
  accessToken: 'apple-access',
  refreshToken: 'apple-refresh',
  isNewUser: true,
  termsAgreed: false,
  hasCompletedOnboarding: false,
}

describe('signInWithAppleToken', () => {
  afterEach(async () => {
    vi.clearAllMocks()
    await clearTokens()
  })

  it('로그인 성공 시 요청을 그대로 전달하고 토큰을 저장한 뒤 결과를 반환한다', async () => {
    vi.mocked(loginWithApple).mockResolvedValue({ data: loginData })

    const request = {
      identityToken: 'identity-token',
      authorizationCode: 'auth-code',
      givenName: '수민',
      familyName: '김',
    }
    const result = await signInWithAppleToken(request)

    expect(loginWithApple).toHaveBeenCalledWith(request)
    expect(result).toEqual(loginData)
    expect(getAccessToken()).toBe('apple-access')
    expect(getRefreshToken()).toBe('apple-refresh')
  })

  it('응답에 토큰이 없으면 저장하지 않고 실패한다', async () => {
    vi.mocked(loginWithApple).mockResolvedValue({ data: undefined })

    await expect(signInWithAppleToken({ identityToken: 'identity-token' })).rejects.toThrow(
      '로그인 응답에 토큰이 없습니다.',
    )
    expect(getAccessToken()).toBeNull()
  })

  it('로그인 API가 실패하면 그대로 전파하고 토큰을 저장하지 않는다', async () => {
    vi.mocked(loginWithApple).mockRejectedValue(new Error('network down'))

    await expect(signInWithAppleToken({ identityToken: 'identity-token' })).rejects.toThrow(
      'network down',
    )
    expect(getAccessToken()).toBeNull()
  })
})
