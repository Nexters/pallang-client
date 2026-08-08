'use client'

import { use } from 'react'

import { TraceDraftContext } from '../_data/traceDraft.store'

export function useTraceDraft() {
  const value = use(TraceDraftContext)
  if (!value) throw new Error('useTraceDraft는 TraceDraftProvider 안에서만 쓸 수 있습니다.')
  return value
}
