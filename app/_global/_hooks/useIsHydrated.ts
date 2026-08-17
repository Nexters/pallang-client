'use client'

import { useSyncExternalStore } from 'react'

const noop = () => undefined
// 구독할 외부 스토어가 없다 — 값은 하이드레이션 한 번으로 결정되고 그 뒤로 바뀌지 않는다
const emptySubscribe = () => noop
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * 하이드레이션이 끝났는지. 서버 렌더와 클라이언트 첫 렌더에서는 false, 붙고 난 뒤 true다.
 *
 * useEffect로 세우는 상태와 달리 서버 스냅샷을 따로 주므로 React가 첫 렌더를 서버와 같은 값으로
 * 그린다 — 현재 시각처럼 프리렌더에서 쓸 수 없는 값을 hydration 뒤로 미룰 때 쓴다.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
}
