// 애플 인증(authorize) 서비스 — 플랫폼 분기와 실패 판별만 담당한다.
// iOS 앱: 플러그인이 네이티브 Sign in with Apple 시트(ASAuthorization)를 띄운다. 앱 Bundle ID로
//   인증하므로 clientId/redirectURI는 쓰이지 않는다(플러그인 타입상 필수라 빈 값을 넘긴다).
// 그 외(브라우저·Android 웹뷰): 플러그인 web 구현이 Apple JS SDK(appleid.auth.js)를 로드해
//   usePopup 방식으로 진행한다. Service ID·Return URL이 env에 있어야 한다.

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

// 웹 팝업 경로에 필요한 env가 아직 없을 때(Service ID 미발급 등) 던진다.
// 호출부는 이 에러를 "설정 안 됨" 안내로 바꿔 보여준다 — 빌드·다른 로그인은 깨지지 않는다.
export class AppleAuthNotConfiguredError extends Error {
  constructor() {
    super(
      '애플 로그인 웹 설정(NEXT_PUBLIC_APPLE_CLIENT_ID/NEXT_PUBLIC_APPLE_REDIRECT_URI)이 없습니다.',
    )
    this.name = 'AppleAuthNotConfiguredError'
  }
}

// 사용자가 스스로 닫은 경우 — 에러로 표시하지 않기 위해 판별한다.
// iOS 네이티브는 ASAuthorizationError.canceled(1001)의 localizedDescription 문자열로,
// Apple JS SDK는 { error: 'popup_closed_by_user' } 형태로 거절된다.
export function isAppleAuthCancel(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const code = error.error
    return code === 'popup_closed_by_user' || code === 'user_cancelled_authorize'
  }
  if (error instanceof Error) return error.message.includes('1001')
  return false
}

// 애플 authorize 실행. 성공 시 identityToken(필수)과 부가 정보를 돌려준다.
export async function authorizeWithApple(): Promise<AppleAuthorization> {
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'

  let clientId = ''
  let redirectURI = ''
  if (!isNativeIos) {
    const envClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID
    const envRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI
    if (!envClientId || !envRedirectUri) throw new AppleAuthNotConfiguredError()
    clientId = envClientId
    redirectURI = envRedirectUri
  }

  const { response } = await SignInWithApple.authorize({
    clientId,
    redirectURI,
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
