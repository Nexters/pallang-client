// 로그인 성공 후 이동할 경로. 카카오 웹 콜백·카카오 네이티브·애플 로그인이 모두 같은 분기를 쓴다.
// 세 곳에 흩어져 있으면 온보딩이 들어올 때 한 곳을 빠뜨려, 그 경로로 들어온 사용자만 조용히 건너뛴다.

import {
  getSessionStorageItem,
  removeSessionStorageItem,
  setSessionStorageItem,
} from '@/app/_global/_utils/sessionStorage'

import { HOME_PATH, SIGN_UP_TERMS_PATH } from '../_data/auth.constant'

// LoginResponse와 구조가 같은 최소 타입(_apis 직접 import 금지 — queryClient.service와 같은 방식).
type PostLoginState = {
  termsAgreed: boolean
  hasCompletedOnboarding: boolean
}

// 초대 링크처럼 "로그인 뒤 원래 자리로 돌아와야 하는" 화면이 심는 경로.
// 앱 내 경로만 허용한다 — `//evil.com`은 브라우저가 프로토콜 상대 URL(외부 도메인)로 읽어
// 로그인 직후 앱 밖으로 튕겨 나가기 때문이다(open redirect).
const RETURN_PATH_KEY = 'pallang.postLoginReturnPath'

export function markPostLoginReturnPath(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//')) return
  setSessionStorageItem(RETURN_PATH_KEY, path)
}

/** 게이트에 막히지 않고 그대로 실행된 액션이 심어 둔 자리를 걷는다 — 다음 로그인이 여기로 끌려오지 않게. */
export function clearPostLoginReturnPath(): void {
  removeSessionStorageItem(RETURN_PATH_KEY)
}

// 한 번 쓰면 지운다 — 남겨 두면 한참 뒤의 로그인까지 그때 그 화면으로 끌려간다.
function consumePostLoginReturnPath(): string | null {
  const path = getSessionStorageItem(RETURN_PATH_KEY)
  if (path === null) return null
  removeSessionStorageItem(RETURN_PATH_KEY)
  return path
}

export function resolvePostLoginPath(login: PostLoginState): string {
  // 약관 미동의(신규) 사용자는 약관 동의 화면에서 동의를 받는다.
  // 여기서는 복귀 경로를 꺼내지 않는다 — 가입 절차 도중에 소비해 버리면 약관→환영으로 이어지는
  // 흐름이 끊긴다. ponytail: 온보딩이 들어오면 그 마지막 단계가 이 자리를 꺼내 쓰게 한다
  // (그전까지 신규 가입자는 초대 화면 대신 홈에 도착하고, 심어 둔 자리는 세션에 남는다).
  if (!login.termsAgreed) return SIGN_UP_TERMS_PATH

  // TODO(onboarding): !login.hasCompletedOnboarding이면 온보딩 라우트로 보낸다(미구현이라 홈으로).
  return consumePostLoginReturnPath() ?? HOME_PATH
}
