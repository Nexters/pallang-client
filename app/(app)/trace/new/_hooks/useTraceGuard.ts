'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { resolveGuardRedirect } from '../_services/traceGuard.service'
import { useTraceDraft } from './useTraceDraft'
import { useTraceNav } from './useTraceNav'

/**
 * 현재 경로가 draft 상태에 맞지 않으면 이동시키고, 그 이동 대상을 반환한다.
 * 실제 이동은 effect에서 일어나므로, 호출부는 반환값이 non-null인 동안 렌더를 막아야 한다.
 */
export function useTraceGuard(): string | null {
  const pathname = usePathname()
  const router = useRouter()
  const { draft } = useTraceDraft()
  const { isLeaving } = useTraceNav()

  // 플로우를 벗어나는 중이면 초안은 이미 비워진 뒤다. 그 빈 초안에 판정을 걸면 첫 화면으로
  // 되밀어, 나가려던 이동(홈·들어온 자리)을 덮어쓴다 — 그래서 나가는 동안에는 물러나 있는다.
  const redirect = isLeaving ? null : resolveGuardRedirect(pathname, draft)

  useEffect(() => {
    if (redirect) router.replace(redirect)
  }, [redirect, router])

  return redirect
}
