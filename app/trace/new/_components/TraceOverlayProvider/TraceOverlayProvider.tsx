'use client'

import { type ReactNode, useMemo, useRef } from 'react'

import { TraceOverlayContext, type TraceOverlayRegistry } from '../../_data/traceOverlay.store'

/**
 * 열려 있는 시트·폼·다이얼로그를 쌓아 두고, 이탈 시도가 위에서부터 한 층씩 걷어내게 한다.
 * 스택은 ref에 둔다 — 등록·해제가 렌더를 유발하면 오버레이를 여는 순간 화면이 한 번 더 그려진다.
 */
export function TraceOverlayProvider({ children }: { children: ReactNode }) {
  const stackRef = useRef<(() => void)[]>([])

  const value = useMemo<TraceOverlayRegistry>(
    () => ({
      closeTop: () => {
        const top = stackRef.current.at(-1)
        if (!top) return false
        top()
        return true
      },
      hasOverlay: () => stackRef.current.length > 0,
      register: (close) => {
        stackRef.current = [...stackRef.current, close]
        return () => {
          stackRef.current = stackRef.current.filter((item) => item !== close)
        }
      },
    }),
    [],
  )

  return <TraceOverlayContext value={value}>{children}</TraceOverlayContext>
}
