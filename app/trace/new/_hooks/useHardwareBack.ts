'use client'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef } from 'react'

/**
 * Android 하드웨어 back을 가로챈다. 기본 동작은 웹뷰 히스토리를 되감는 것이라,
 * 가로채지 않으면 작성 중이던 흔적이 확인 없이 사라진다.
 * 네이티브가 아닌 환경(브라우저)에서는 리스너를 붙이지 않는다 — 스택이 두 칸이라
 * 브라우저 back이 그대로 홈으로 나가는 것이 기대 동작과 같다.
 */
export function useHardwareBack(onBack: () => void): void {
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handle = App.addListener('backButton', () => {
      onBackRef.current()
    })

    return () => {
      handle
        .then((listener) => listener.remove())
        .catch((error: unknown) => {
          console.error('하드웨어 back 리스너를 해제하지 못했습니다.', error)
        })
    }
  }, [])
}
