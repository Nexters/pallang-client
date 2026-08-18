'use client'

import { use } from 'react'

import { TraceCaptureContext } from '../_data/traceCapture.store'

export function useTraceCapture() {
  const value = use(TraceCaptureContext)
  if (!value) throw new Error('useTraceCapture는 TraceCaptureProvider 안에서만 쓸 수 있습니다.')
  return value
}
