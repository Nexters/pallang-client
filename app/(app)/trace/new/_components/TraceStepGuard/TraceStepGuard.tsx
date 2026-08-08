'use client'

import type { ReactNode } from 'react'

import { useTraceGuard } from '../../_hooks/useTraceGuard'

export function TraceStepGuard({ children }: { children: ReactNode }) {
  const redirect = useTraceGuard()

  // 렌더 게이트. children을 먼저 렌더하면 자식 effect가 부모 effect(리다이렉트)보다
  // 앞서 실행되어, 이동할 화면인데도 카메라가 열리거나 잘못된 화면이 한 프레임 깜빡인다.
  if (redirect) return null

  return children
}
