'use client'

import { useEffect, useRef } from 'react'

import { useTraceOverlay } from './useTraceOverlay'

/**
 * open인 동안 오버레이 스택에 등록해, 뒤로가기가 화면을 떠나는 대신 이 층을 닫게 한다.
 * close는 매 렌더 새로 만들어지는 경우가 많아 ref로 최신 값을 참조한다
 * (등록 함수 자체를 의존성에 넣으면 열려 있는 동안 등록·해제가 반복된다).
 */
export function useOverlayBackGuard(open: boolean, close: () => void): void {
  const { register } = useTraceOverlay()
  const closeRef = useRef(close)

  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return
    return register(() => {
      closeRef.current()
    })
  }, [open, register])
}
