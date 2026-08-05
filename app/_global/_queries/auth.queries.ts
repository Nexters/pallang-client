// 인증 세션 브리지.
// feature 코드는 생성된 `_apis`를 직접 import할 수 없으므로(_queries만 허용), 카카오 로그인·약관·로그아웃·
// refresh 배선을 여기 모아 노출한다. 순수 조회가 아니라 mutation/세션 성격이지만, _apis 접근이 허용되는
// 유일한 계층이라 여기에 둔다.

import {
  agreeToTerms,
  loginWithApple,
  loginWithKakao,
  logout,
  refresh,
} from '../_apis/_generated/auth/auth'
import type { AppleLoginRequest } from '../_apis/_generated/models/appleLoginRequest'
import type { LoginResponse } from '../_apis/_generated/models/loginResponse'
import { setAccessTokenGetter, setTokenRefresher } from '../_apis/customFetch.api'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hydrateTokens,
  saveTokens,
} from '../_services/authToken.service'

// 401(만료) 시 리프레시 토큰으로 새 토큰을 발급한다. 실패하면 토큰을 비우고 null.
async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = getRefreshToken()
  if (!currentRefreshToken) return null

  try {
    const res = await refresh({ refreshToken: currentRefreshToken })
    const accessToken = res.data?.accessToken
    const refreshToken = res.data?.refreshToken
    if (!accessToken || !refreshToken) {
      await clearTokens()
      return null
    }
    await saveTokens({ accessToken, refreshToken })
    return accessToken
  } catch (error) {
    console.warn('토큰 재발급 실패', error)
    await clearTokens()
    return null
  }
}

// 앱 부팅 시 1회. 영속 토큰 복원 + customFetch에 토큰 getter/refresher 연결.
export async function initAuthSession(): Promise<void> {
  await hydrateTokens()
  setAccessTokenGetter(getAccessToken)
  setTokenRefresher(refreshAccessToken)
}

// 웹·앱 공통: 카카오 액세스 토큰 → pallang 로그인 → 토큰 저장 → 로그인 결과 반환.
export async function signInWithKakaoToken(kakaoAccessToken: string): Promise<LoginResponse> {
  const res = await loginWithKakao({ kakaoAccessToken })
  const data = res.data
  if (!data?.accessToken || !data.refreshToken) {
    throw new Error('로그인 응답에 토큰이 없습니다.')
  }
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return data
}

// 웹·앱 공통: 애플 identity token → pallang 로그인 → 토큰 저장 → 로그인 결과 반환.
// authorizationCode는 탈퇴 시 애플 연동 해제(revoke)용이라 받았으면 함께 보낸다.
export async function signInWithAppleToken(request: AppleLoginRequest): Promise<LoginResponse> {
  const res = await loginWithApple(request)
  const data = res.data
  if (!data?.accessToken || !data.refreshToken) {
    throw new Error('로그인 응답에 토큰이 없습니다.')
  }
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return data
}

// 약관 동의(신규 사용자). JWT로 사용자를 식별하므로 본문은 없다.
export async function agreeTerms(): Promise<void> {
  await agreeToTerms()
}

// 로그아웃: 서버 리프레시 토큰 폐기 + 로컬 토큰 정리. 서버 실패해도 로컬은 정리한다.
export async function signOut(): Promise<void> {
  const currentRefreshToken = getRefreshToken()
  try {
    if (currentRefreshToken) await logout({ refreshToken: currentRefreshToken })
  } catch (error) {
    console.warn('로그아웃 요청 실패', error)
  } finally {
    await clearTokens()
  }
}
