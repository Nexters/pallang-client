// 회원 탈퇴 완료 알림 플래그.
// 탈퇴 확정 → 토큰 정리(unauthenticated 전환) → /my 이동 → 스낵바 1회 노출 흐름에서
// 두 화면(프로필 설정 → 마이페이지) 사이를 건너야 해서 sessionStorage에 잠깐 얹는다.
// AuthProvider도 이 플래그를 읽는다 — 토큰이 비는 순간을 세션 만료로 오인해
// 로그인 화면으로 보내지 않게 하기 위함이다(탈퇴는 비로그인 마이페이지로 간다).

const WITHDRAWAL_COMPLETED_KEY = 'pallang.withdrawalCompleted'

// 웹뷰 프라이빗 모드 등 storage 접근이 막히면 스낵바만 포기하고 흐름은 계속한다.
function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** 탈퇴 성공 직후, 토큰을 비우기 전에 호출한다. */
export function markWithdrawalCompleted(): void {
  safeSessionStorage()?.setItem(WITHDRAWAL_COMPLETED_KEY, '1')
}

/** 플래그를 지우지 않고 읽는다 — AuthProvider의 세션 만료 리다이렉트 억제용. */
export function hasPendingWithdrawalNotice(): boolean {
  return safeSessionStorage()?.getItem(WITHDRAWAL_COMPLETED_KEY) === '1'
}

/** 마이페이지 도착 시 1회 소비한다. true면 탈퇴 완료 스낵바를 띄운다. */
export function consumeWithdrawalNotice(): boolean {
  const storage = safeSessionStorage()
  if (storage?.getItem(WITHDRAWAL_COMPLETED_KEY) !== '1') return false
  storage.removeItem(WITHDRAWAL_COMPLETED_KEY)
  return true
}
