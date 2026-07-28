'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { resolveGuardRedirect } from '../_services/traceGuard.service'
import { useTraceDraft } from './useTraceDraft'

/**
 * 현재 경로가 draft 상태에 맞지 않으면 이동시키고, 그 이동 대상을 반환한다.
 * 실제 이동은 effect에서 일어나므로, 호출부는 반환값이 non-null인 동안 렌더를 막아야 한다.
 */
export function useTraceGuard(): string | null {
  const pathname = usePathname()
  const router = useRouter()
  const { draft } = useTraceDraft()

  const redirect = resolveGuardRedirect(pathname, draft)

  useEffect(() => {
    if (redirect) router.replace(redirect)
  }, [redirect, router])

  return redirect
}
