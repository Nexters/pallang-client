'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { resolveGuardRedirect } from '../_services/traceGuard.service'
import { useTraceDraft } from './useTraceDraft'

export function useTraceGuard(): void {
  const pathname = usePathname()
  const router = useRouter()
  const { draft } = useTraceDraft()

  useEffect(() => {
    const redirect = resolveGuardRedirect(pathname, draft)
    if (redirect) router.replace(redirect)
  }, [pathname, draft, router])
}
