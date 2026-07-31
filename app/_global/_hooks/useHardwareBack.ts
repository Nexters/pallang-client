'use client'

import { useEffect, useRef } from 'react'

import { useHardwareBackRegistry } from '@/app/_global/_hooks/useHardwareBackRegistry'

/**
 * 이 화면이 살아 있는 동안 하드웨어/제스처 back을 가져간다.
 * 나중에 마운트된 화면이 우선이고, 언마운트되면 아래층(없으면 기본 되감기)으로 돌아간다.
 * 가로채지 않으면 기본 동작이 히스토리를 되감아, 작성 중이던 흔적이 확인 없이 사라진다.
 *
 * onBack은 매 렌더 새로 만들어지는 경우가 많아 ref로 최신 값을 참조한다
 * (등록을 의존성에 걸면 화면이 살아 있는 동안 등록·해제가 반복된다).
 */
export function useHardwareBack(onBack: () => void): void {
  const { register } = useHardwareBackRegistry()
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(
    () =>
      register(() => {
        onBackRef.current()
      }),
    [register],
  )
}
