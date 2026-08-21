'use client'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'

import { AppBackContext, type AppBackRegistry } from '@/app/_global/_data/appBack.store'

/**
 * 우리가 심은 엔트리임을 알아보는 표식. Next가 넣어 둔 state는 그대로 두고 옆에 얹는다.
 * 뒤로 갈 때는 엔트리를 벗어나므로 읽히지 않지만, 앞으로 갈 때는 그 위에 올라서므로 읽힌다.
 */
const BACK_GUARD_KEY = '__pallangBackGuard'

/**
 * 앱 전체의 뒤로가기 소유자.
 *
 * 뒤로가기가 들어오는 길은 셋이다 — 안드로이드 하드웨어/제스처 back, iOS 엣지 스와이프,
 * 브라우저 back. 셋을 한 코드 경로로 모으려고 **히스토리**를 유일한 통로로 삼는다.
 *
 * 화면 위에 닫을 층(오버레이·시트·이탈 가드)이 있는 동안 같은 URL의 빈 엔트리를 하나 물고
 * 있다가, `popstate`로 그 엔트리를 빠져나오면 맨 위 층에게 back을 넘긴다. 층이 없으면
 * 엔트리도 없으므로 뒤로가기가 평소대로 화면을 벗어난다.
 *
 * iOS 엣지 스와이프는 UIKit이 `WKWebView.goBack()`을 직접 구동해 JS가 가로챌 방법이 없다.
 * 히스토리를 통로로 쓰면 그 경로도 결국 `popstate`로 도착해 같은 판정을 받는다.
 */
function isGuardEntry(state: unknown): boolean {
  return typeof state === 'object' && state !== null && BACK_GUARD_KEY in state
}

export function AppBackProvider({ children }: { children: ReactNode }) {
  // 스택은 ref에 둔다 — 등록·해제가 렌더를 유발하면 화면이 열릴 때마다 한 번 더 그려진다.
  const stackRef = useRef<(() => void)[]>([])
  /** 지금 우리가 심어 둔 엔트리를 물고 있는지 */
  const isGuardedRef = useRef(false)
  /** 우리가 직접 되감아 생긴 popstate인지 — 그건 사용자의 뒤로가기가 아니라 뒷정리다 */
  const isSelfPopRef = useRef(false)

  /** 닫을 층이 생겼는데 엔트리가 없으면 심는다 */
  const guard = useCallback(() => {
    if (isGuardedRef.current) return
    isGuardedRef.current = true
    // URL을 바꾸지 않는다 — 라우터가 보기에 같은 화면이라 아무 것도 다시 그리지 않는다.
    // Next가 엔트리에 넣어 둔 내부 state를 그대로 실어야 라우터가 이 엔트리를 알아본다.
    window.history.pushState({ ...window.history.state, [BACK_GUARD_KEY]: true }, '')
  }, [])

  /** 층이 화면 안 버튼으로 닫혔다 — 뒤로가기로 소비되지 않은 엔트리를 걷는다 */
  const unguard = useCallback(() => {
    if (!isGuardedRef.current || stackRef.current.length > 0) return
    isGuardedRef.current = false
    isSelfPopRef.current = true
    window.history.back()
  }, [])

  const value = useMemo<AppBackRegistry>(
    () => ({
      register: (handler) => {
        stackRef.current = [...stackRef.current, handler]
        guard()
        return () => {
          stackRef.current = stackRef.current.filter((item) => item !== handler)
          unguard()
        }
      },
      back: () => {
        // 심어 둔 엔트리는 되돌아갈 자리로 세지 않는다 — 우리가 방금 만든 자리다
        const guardDepth = isGuardedRef.current ? 1 : 0
        if (window.history.length <= guardDepth + 1) return false
        // go(-2)도 popstate는 한 번만 쏜다 — 한 번만 흘려보내면 된다
        isSelfPopRef.current = true
        isGuardedRef.current = false
        window.history.go(-1 - guardDepth)
        return true
      },
    }),
    [guard, unguard],
  )

  useEffect(() => {
    const onPopState = () => {
      // 우리가 unguard로 되감은 것 — 여기서 멈추지 않으면 자기 뒷정리를 뒤로가기로 오해한다
      if (isSelfPopRef.current) {
        isSelfPopRef.current = false
        return
      }

      // 앞으로 가기로 우리가 심어 둔 엔트리에 도로 올라섰다(층을 화면 안 버튼으로 닫으면 그 엔트리가
      // 앞쪽에 남는다). 지키던 층은 이미 닫혀 되돌릴 것이 없고, 그냥 두면 다음 뒤로가기 한 번이
      // 아무 일도 없이 삼켜진다 — 같은 URL이라 화면을 바꾸지 않고 그 자리에서 물러난다.
      if (isGuardEntry(window.history.state)) {
        isSelfPopRef.current = true
        window.history.back()
        return
      }

      // 물고 있던 엔트리를 빠져나왔다. 이 시점에 히스토리는 이미 한 칸 뒤에 있다.
      isGuardedRef.current = false

      const top = stackRef.current.at(-1)
      // 닫을 층이 없으면 진짜 화면 이동이다 — 라우터에게 그대로 넘긴다
      if (!top) return

      top()
      // 핸들러가 층을 닫았는지는 React가 커밋한 뒤에야 알 수 있다. 그때까지 무방비로 두면
      // 연달아 누른 뒤로가기가 화면을 벗어나므로, 남아 있다고 보고 먼저 다시 심는다.
      // 실제로 닫혔으면 등록 해제가 unguard로 이 엔트리를 걷는다(같은 URL이라 화면은 그대로다).
      guard()
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [guard])

  useEffect(() => {
    // 브라우저·iOS는 뒤로가기가 히스토리를 거쳐 popstate로 도착한다 — 따로 받을 것이 없다.
    if (!Capacitor.isNativePlatform()) return

    // 안드로이드는 back이 네이티브 이벤트로 온다. 리스너를 하나라도 붙이면 기본 되감기가
    // 통째로 꺼지므로 되감기와 종료까지 여기서 책임진다. 층 판정은 하지 않고 히스토리로
    // 흘려보낸다 — 그래야 세 경로가 popstate 한 곳에서 같은 판정을 받는다.
    const handle = App.addListener('backButton', ({ canGoBack }) => {
      // canGoBack은 네이티브가 웹뷰 히스토리를 보고 넘겨준 값이다. 층을 물고 있으면 우리가
      // 심은 엔트리가 있어 언제나 참이다. 되돌아갈 곳이 정말 없으면 안드로이드 관례대로
      // 앱을 닫는다 — 가만히 있으면 고장으로 보인다.
      if (canGoBack || isGuardedRef.current) window.history.back()
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

  return <AppBackContext value={value}>{children}</AppBackContext>
}
