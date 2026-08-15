const ONBOARDING_SEEN_STORAGE_KEY = 'pallang:onboarding-seen'

/**
 * 로그인 전 첫 실행 판정이라 서버에 둘 수 없어 localStorage로 기기당 1회를 가린다.
 * 접근이 막힌 환경(프라이빗 모드 등)에서는 '본 것'으로 친다 — 매 진입마다 온보딩이 뜨는 것보다 낫다.
 */
export function hasSeenOnboarding(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

export function markOnboardingSeen(): void {
  try {
    window.localStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, '1')
  } catch {
    // 저장에 실패하면 다음 진입에 온보딩이 한 번 더 뜰 뿐, 동작은 깨지지 않는다
  }
}
