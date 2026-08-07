'use client'

import { use } from 'react'

import { TraceOverlayContext } from '../_data/traceOverlay.store'

export function useTraceOverlay() {
  const value = use(TraceOverlayContext)
  if (!value) throw new Error('useTraceOverlay는 TraceOverlayProvider 안에서만 쓸 수 있습니다.')
  return value
}
