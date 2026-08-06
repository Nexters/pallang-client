// 로그인 성공 후 이동할 경로. 카카오 웹 콜백·카카오 네이티브·애플 로그인이 모두 같은 분기를 쓴다.
// 세 곳에 흩어져 있으면 온보딩이 들어올 때 한 곳을 빠뜨려, 그 경로로 들어온 사용자만 조용히 건너뛴다.

import { HOME_PATH, SIGN_UP_TERMS_PATH } from '../_data/auth.constant'

// LoginResponse와 구조가 같은 최소 타입(_apis 직접 import 금지 — queryClient.service와 같은 방식).
type PostLoginState = {
  termsAgreed: boolean
  hasCompletedOnboarding: boolean
}

export function resolvePostLoginPath(login: PostLoginState): string {
  // 약관 미동의(신규) 사용자는 약관 동의 화면에서 동의를 받는다.
  if (!login.termsAgreed) return SIGN_UP_TERMS_PATH

  // TODO(onboarding): !login.hasCompletedOnboarding이면 온보딩 라우트로 보낸다(미구현이라 홈으로).
  return HOME_PATH
}
