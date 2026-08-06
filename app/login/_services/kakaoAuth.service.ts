// 카카오 인증(authorize) 서비스 — iOS 네이티브 전용.
// 네이티브 플러그인이 카카오톡이 깔려 있으면 카카오톡 앱으로 전환하고, 없으면 시스템 인증 시트를 띄운다.
// 둘 다 웹뷰 밖에서 그려져 노치·safe area를 시스템이 처리한다.
// 브라우저와 안드로이드 앱은 이 경로를 타지 않고 서버 302(KAKAO_LOGIN_PATH)로 카카오 웹 OAuth를 진행한다.

import { registerPlugin } from '@capacitor/core'

// 네이티브 KakaoLoginPlugin의 jsName·메서드와 맞춘 타입.
type KakaoLoginPlugin = {
  login: () => Promise<{ accessToken: string }>
}

const KakaoLogin = registerPlugin<KakaoLoginPlugin>('KakaoLogin')

// 네이티브가 취소를 알리는 코드(KakaoLoginPlugin.cancelCode와 같은 값이어야 한다).
const KAKAO_CANCEL_CODE = 'KAKAO_LOGIN_CANCELLED'

// 사용자가 카카오톡·인증 시트를 스스로 닫은 경우 — 에러로 표시하지 않기 위해 판별한다.
export function isKakaoAuthCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === KAKAO_CANCEL_CODE
  )
}

// 카카오 authorize 실행. 성공 시 카카오 액세스 토큰을 돌려준다.
// 백엔드(signInWithKakaoToken)가 요구하는 값이 이것 하나라 나머지 토큰은 받지 않는다.
export async function authorizeWithKakao(): Promise<string> {
  const { accessToken } = await KakaoLogin.login()

  if (!accessToken) {
    throw new Error('카카오 응답에 액세스 토큰이 없습니다.')
  }

  return accessToken
}
