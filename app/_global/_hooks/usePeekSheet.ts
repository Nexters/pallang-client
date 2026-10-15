'use client'

import { createContext, type RefObject, useContext } from 'react'

type PeekSheetApi = {
  expand: () => void
  /** 시트가 스스로 스크롤하는 패널 — 무한스크롤 관찰 루트로 쓴다 */
  scrollerRef: RefObject<HTMLDivElement | null>
}

export const PeekSheetContext = createContext<PeekSheetApi | null>(null)

/** PeekSheet 안 본문이 시트를 올릴 때 쓴다. 시트 밖에서 부르면 안 된다. */
export function usePeekSheet(): PeekSheetApi {
  const sheet = useContext(PeekSheetContext)
  if (sheet === null) {
    throw new Error('usePeekSheet는 PeekSheet 안에서만 쓴다')
  }
  return sheet
}
