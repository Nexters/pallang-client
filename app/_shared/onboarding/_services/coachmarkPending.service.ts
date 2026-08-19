import {
  getSessionStorageItem,
  removeSessionStorageItem,
  setSessionStorageItem,
} from '@/app/_global/_utils/sessionStorage'

const HOME_COACHMARK_PENDING_STORAGE_KEY = 'pallang:home-coachmark-pending'

/**
 * 온보딩을 마치고 홈으로 보낼 때 코치마크를 예약한다.
 *
 * localStorage가 아니라 sessionStorage인 이유: 코치마크는 '온보딩 직후 그 홈'에서만 뜬다.
 * localStorage에 두면 그 자리에서 못 봤을 때 며칠 뒤 아무 맥락 없이 홈에서 튀어나온다.
 * 온보딩 → 홈은 replace로 이어지는 같은 세션이라 sessionStorage로 충분하다.
 */
export function markHomeCoachmarkPending(): void {
  setSessionStorageItem(HOME_COACHMARK_PENDING_STORAGE_KEY, '1')
}

/** 예약이 있으면 true를 돌려주면서 지운다 — 읽는 순간 소비해 두 번 뜨지 않는다. */
export function consumeHomeCoachmarkPending(): boolean {
  const isPending = getSessionStorageItem(HOME_COACHMARK_PENDING_STORAGE_KEY) === '1'
  if (isPending) removeSessionStorageItem(HOME_COACHMARK_PENDING_STORAGE_KEY)

  return isPending
}
