'use client'

import { type ReactNode, useMemo, useReducer } from 'react'

import {
  initialTraceDraft,
  TraceDraftContext,
  traceDraftReducer,
} from '../../_data/traceDraft.store'

export function TraceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(traceDraftReducer, initialTraceDraft)
  const value = useMemo(() => ({ draft, dispatch }), [draft])

  return <TraceDraftContext value={value}>{children}</TraceDraftContext>
}
