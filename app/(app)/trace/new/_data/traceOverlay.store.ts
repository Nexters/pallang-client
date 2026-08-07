'use client'

import { createContext } from 'react'

export type TraceOverlayRegistry = {
  /** 가장 나중에 등록된 오버레이를 닫는다. 닫을 것이 없으면 false. */
  closeTop: () => boolean
  hasOverlay: () => boolean
  /** 오버레이를 등록하고, 해제 함수를 돌려준다. */
  register: (close: () => void) => () => void
}

export const TraceOverlayContext = createContext<TraceOverlayRegistry | null>(null)
