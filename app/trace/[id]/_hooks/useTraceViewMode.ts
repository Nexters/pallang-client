import { useCallback, useRef, useState } from 'react'

// 경계에서 덜컹거리지 않도록 진입/복귀 임계값을 분리한 히스테리시스
const ENTER_COMPACT_AT = 40
const EXIT_COMPACT_AT = 8

export type TraceViewMode = 'postit' | 'compact'

type ScrollLike = { currentTarget: { scrollTop: number } }

export function useTraceViewMode() {
  const [viewMode, setViewMode] = useState<TraceViewMode>('postit')
  const modeRef = useRef<TraceViewMode>('postit')

  const handleListScroll = useCallback((event: ScrollLike) => {
    const top = event.currentTarget.scrollTop
    const next: TraceViewMode =
      modeRef.current === 'postit'
        ? top > ENTER_COMPACT_AT
          ? 'compact'
          : 'postit'
        : top < EXIT_COMPACT_AT
          ? 'postit'
          : 'compact'
    if (next !== modeRef.current) {
      modeRef.current = next
      setViewMode(next)
    }
  }, [])

  return { viewMode, handleListScroll }
}
