const HOME_COACH_MARK_PENDING_STORAGE_KEY = 'pallang:home-coachmark-pending'
const HOME_COACH_MARK_SEEN_STORAGE_KEY = 'pallang:home-coachmark-seen'

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function markHomeCoachMarkPending(): void {
  try {
    safeLocalStorage()?.setItem(HOME_COACH_MARK_PENDING_STORAGE_KEY, '1')
  } catch {
    // 저장에 실패하면 코치마크를 생략한다. 홈 진입 흐름은 계속되어야 한다.
  }
}

export function shouldShowHomeCoachMark(): boolean {
  try {
    const storage = safeLocalStorage()
    if (!storage) return false

    return (
      storage.getItem(HOME_COACH_MARK_PENDING_STORAGE_KEY) === '1' &&
      storage.getItem(HOME_COACH_MARK_SEEN_STORAGE_KEY) !== '1'
    )
  } catch {
    return false
  }
}

export function markHomeCoachMarkSeen(): void {
  try {
    const storage = safeLocalStorage()
    if (!storage) return

    storage.setItem(HOME_COACH_MARK_SEEN_STORAGE_KEY, '1')
    storage.removeItem(HOME_COACH_MARK_PENDING_STORAGE_KEY)
  } catch {
    // 실패해도 현재 화면에서는 닫힌 상태를 유지한다.
  }
}
