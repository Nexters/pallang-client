// 계정 경계에서 쿼리 캐시를 비우는지 검증 — 브라우저 QueryClient는 모듈 싱글턴이라
// 로그아웃/재로그인 시 안 비우면 이전 계정의 캐시(me·좋아요…)가 다음 계정 화면에 그대로 나온다.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { loginWithApple, loginWithKakao, logout } from '@/app/_global/_apis/_generated/auth/auth'
import type { LoginResponse } from '@/app/_global/_apis/_generated/models/loginResponse'
import {
  signInWithAppleToken,
  signInWithKakaoToken,
  signOut,
} from '@/app/_global/_queries/auth.queries'
import { clearTokens } from '@/app/_global/_services/authToken.service'
import { getQueryClient } from '@/app/_global/_services/queryClient.service'

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
  accessToken: 'access',
  refreshToken: 'refresh',
  isNewUser: false,
  termsAgreed: true,
  hasCompletedOnboarding: true,
}

/** 이전 계정의 서버 상태가 캐시에 남아 있는 상황을 흉내 낸다 */
function seedPreviousAccountCache(): void {
  getQueryClient().setQueryData(['user', 'me'], { nickname: '이전계정' })
}

function cachedQueryCount(): number {
  return getQueryClient().getQueryCache().getAll().length
}

describe('세션 경계의 쿼리 캐시 정리', () => {
  afterEach(async () => {
    vi.clearAllMocks()
    getQueryClient().clear()
    await clearTokens()
  })

  it('로그아웃하면 캐시를 비운다 — 서버 로그아웃이 실패해도 비운다', async () => {
    seedPreviousAccountCache()
    vi.mocked(logout).mockRejectedValue(new Error('network down'))

    await signOut()

    expect(cachedQueryCount()).toBe(0)
  })

  it('애플 로그인에 성공하면 캐시를 비운다', async () => {
    seedPreviousAccountCache()
    vi.mocked(loginWithApple).mockResolvedValue({ data: loginData })

    await signInWithAppleToken({ identityToken: 'identity-token' })

    expect(cachedQueryCount()).toBe(0)
  })

  it('카카오 로그인에 성공하면 캐시를 비운다', async () => {
    seedPreviousAccountCache()
    vi.mocked(loginWithKakao).mockResolvedValue({ data: loginData })

    await signInWithKakaoToken('kakao-access')

    expect(cachedQueryCount()).toBe(0)
  })

  it('로그인이 실패하면 캐시를 건드리지 않는다 — 보던 화면이 갑자기 비지 않아야 한다', async () => {
    seedPreviousAccountCache()
    vi.mocked(loginWithApple).mockResolvedValue({ data: undefined })

    await expect(signInWithAppleToken({ identityToken: 'identity-token' })).rejects.toThrow()

    expect(cachedQueryCount()).toBe(1)
  })
})
