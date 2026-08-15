'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { hasSeenOnboarding } from '@/app/_shared/onboarding/_services/onboardingSeen.service'

/**
 * 첫 실행이면 홈 대신 온보딩으로 보낸다. 홈에서만 체크한다 — 딥링크 진입은 가로채지 않는다.
 * localStorage는 클라이언트에서만 읽을 수 있어 effect에서 판정하는데, 이 시점에는
 * 스플래시(최소 1초)가 아직 화면을 덮고 있어 홈이 비쳐 보이지 않는다.
 */
export function useOnboardingGate(): void {
  const router = useRouter()

  useEffect(() => {
    if (!hasSeenOnboarding()) router.replace('/onboarding')
  }, [router])
}
