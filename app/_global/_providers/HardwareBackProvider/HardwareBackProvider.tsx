'use client'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { type ReactNode, useEffect, useMemo, useRef } from 'react'

import {
  HardwareBackContext,
  type HardwareBackRegistry,
} from '@/app/_global/_data/hardwareBack.store'

/**
 * Android의 하드웨어 back과 엣지 스와이프(제스처 내비게이션)를 한 곳에서 받는다.
 *
 * Capacitor 기본 동작(@capacitor/app)은 웹뷰 히스토리가 남아 있을 때만 한 칸 되감고,
 * 없으면 아무 것도 하지 않는다 — 첫 화면에서 스와이프하면 반응이 없는 것처럼 보인다.
 * 게다가 리스너를 하나라도 붙이는 순간 네이티브 되감기가 통째로 꺼지므로,
 * 되감기와 종료까지 전부 여기서 책임진다.
 *
 * 리스너를 앱 전체에서 하나만 두는 이유: 화면마다 각자 붙이면 back 한 번에 전부 반응한다.
 * 대신 화면은 스택에 핸들러를 등록하고(useHardwareBack), 가장 나중에 등록한 층이 가져간다.
 */
export function HardwareBackProvider({ children }: { children: ReactNode }) {
  // 스택은 ref에 둔다 — 등록·해제가 렌더를 유발하면 화면이 열릴 때마다 한 번 더 그려진다.
  const stackRef = useRef<(() => void)[]>([])

  const value = useMemo<HardwareBackRegistry>(
    () => ({
      register: (handler) => {
        stackRef.current = [...stackRef.current, handler]
        return () => {
          stackRef.current = stackRef.current.filter((item) => item !== handler)
        }
      },
    }),
    [],
  )

  useEffect(() => {
    // 브라우저에서는 브라우저 back이 그대로 동작한다 — 가로채면 오히려 어긋난다.
    if (!Capacitor.isNativePlatform()) return

    const handle = App.addListener('backButton', ({ canGoBack }) => {
      const top = stackRef.current.at(-1)
      if (top) {
        top()
        return
      }
      // canGoBack은 네이티브가 웹뷰 히스토리를 보고 넘겨준 값이다.
      // 되돌아갈 곳이 없으면 안드로이드 관례대로 앱을 닫는다(가만히 있으면 고장으로 보인다).
      if (canGoBack) window.history.back()
      else void App.exitApp()
    })

    return () => {
      handle
        .then((listener) => listener.remove())
        .catch((error: unknown) => {
          console.error('하드웨어 back 리스너를 해제하지 못했습니다.', error)
        })
    }
  }, [])

  return <HardwareBackContext value={value}>{children}</HardwareBackContext>
}
