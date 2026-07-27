'use client'

import type { ReactNode } from 'react'

import { useTraceGuard } from '../../_hooks/useTraceGuard'

export function TraceStepGuard({ children }: { children: ReactNode }) {
  useTraceGuard()
  return children
}
