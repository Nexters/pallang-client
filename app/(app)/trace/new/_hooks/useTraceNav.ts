'use client'

import { use } from 'react'

import { TraceNavContext } from '../_data/traceNav.store'

export function useTraceNav() {
  const value = use(TraceNavContext)
  if (!value) throw new Error('useTraceNav는 TraceNavProvider 안에서만 쓸 수 있습니다.')
  return value
}
