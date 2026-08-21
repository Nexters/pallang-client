'use client'

import { useEffect, useRef } from 'react'

import { useAppBackRegistry } from '@/app/_global/_hooks/useAppBackRegistry'

/**
 * 이 층이 살아 있는 동안 back(안드로이드 하드웨어 · iOS 엣지 스와이프 · 브라우저)을 가져간다.
 * 나중에 등록한 층이 우선이고, 해제되면 아래층(없으면 기본 되감기)으로 돌아간다.
 * 가로채지 않으면 기본 동작이 히스토리를 되감아, 작성 중이던 흔적이 확인 없이 사라진다.
 *
 * `enabled`로 여닫는 층을 다룬다 — 시트·오버레이는 떠 있는 동안만 가져가야 한다.
 * 항상 등록하면 닫힌 시트가 그 화면의 back을 삼킨다.
 *
 * onBack은 매 렌더 새로 만들어지는 경우가 많아 ref로 최신 값을 참조한다
 * (등록을 의존성에 걸면 층이 살아 있는 동안 등록·해제가 반복된다).
 */
export function useAppBack(onBack: () => void, { enabled = true } = {}): void {
  const { register } = useAppBackRegistry()
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    if (!enabled) return undefined
    return register(() => {
      onBackRef.current()
    })
  }, [enabled, register])
}
