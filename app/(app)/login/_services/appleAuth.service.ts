// 애플 인증(authorize) 서비스 — iOS 네이티브 전용.
// 플러그인이 네이티브 Sign in with Apple 시트(ASAuthorization)를 띄우고, 앱 Bundle ID로
// 인증하므로 clientId/redirectURI는 쓰이지 않는다(플러그인 타입상 필수라 빈 값을 넘긴다).
// 웹 브라우저에는 애플 로그인을 제공하지 않는다 — 버튼 자체를 iOS 앱에서만 노출한다.

import { Capacitor } from '@capacitor/core'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'

import { APPLE_AUTH_SCOPES } from '@/app/_global/_data/auth.constant'

// signInWithAppleToken(AppleLoginRequest)과 구조가 같은 평면 타입.
// _apis 타입을 feature에서 직접 import하지 않기 위해 여기서 따로 정의한다(구조적 타이핑으로 호환).
export type AppleAuthorization = {
  identityToken: string
  authorizationCode?: string
  givenName?: string
  familyName?: string
}

// 애플 로그인 버튼을 노출할 환경인지 — iOS 네이티브 앱에서만 true.
export function isIosNativePlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

// 사용자가 시트를 스스로 닫은 경우 — 에러로 표시하지 않기 위해 판별한다.
// ASAuthorizationError.canceled(1001)가 localizedDescription 문자열로 전달된다.
export function isAppleAuthCancel(error: unknown): boolean {
  return error instanceof Error && error.message.includes('1001')
}

// 애플 authorize 실행. 성공 시 identityToken(필수)과 부가 정보를 돌려준다.
export async function authorizeWithApple(): Promise<AppleAuthorization> {
  const { response } = await SignInWithApple.authorize({
    clientId: '',
    redirectURI: '',
    scopes: APPLE_AUTH_SCOPES,
  })

  if (!response.identityToken) {
    throw new Error('애플 응답에 identity token이 없습니다.')
  }

  return {
    identityToken: response.identityToken,
    authorizationCode: response.authorizationCode || undefined,
    givenName: response.givenName ?? undefined,
    familyName: response.familyName ?? undefined,
  }
}
