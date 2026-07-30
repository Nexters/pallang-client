'use client'

import { useEffect, useRef, useState } from 'react'

export type ExitTransitionState = 'entering' | 'open' | 'exiting'

type ExitTransition = {
  shouldRender: boolean
  state: ExitTransitionState
}

/**
 * base-ui를 쓰지 않는 오버레이의 마운트 수명을 관리한다.
 * open이 false로 바뀌어도 durationMs 동안은 shouldRender를 유지해 퇴장 전환이 보이게 한다.
 *
 * 반환한 state는 호출부에서 data-state 속성으로 넘겨 CSS로 받는다.
 * 어떤 state에 어떤 스타일을 줄지는 컴포넌트가 정한다 — 예컨대 스플래시는 entering에
 * 아무 스타일도 주지 않아 등장 없이 퇴장만 한다.
 *
 * transitionend가 아니라 타이머로 끝을 판정한다. 테스트 환경(happy-dom)에서는 CSS 전환이
 * 실제로 돌지 않아 transitionend가 오지 않기 때문이고, 그래서 duration을 인자로 받는다.
 * 값은 _data/motion.constant.ts의 MOTION_DURATION에서 가져온다.
 */
export function useExitTransition(open: boolean, durationMs: number): ExitTransition {
  const [shouldRender, setShouldRender] = useState(open)
  // 처음부터 열린 채 마운트되면 등장 전환을 건너뛴다 — 화면 진입 때 깜빡이지 않게.
  const [state, setState] = useState<ExitTransitionState>(open ? 'open' : 'exiting')
  const wasOpenRef = useRef(open)

  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open
    // 마운트 직후이거나 open이 그대로면 할 일이 없다.
    // StrictMode가 effect를 두 번 부를 때 등장 전환이 두 번 도는 것도 이 비교가 막는다.
    if (wasOpen === open) return

    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open prop 변화를 entering/open/exiting 전환으로 바꾸는 의도된 동기 setState (rAF/setTimeout으로 다음 단계 예약)
      setShouldRender(true)
      // 마운트와 같은 프레임에 최종 스타일을 주면 브라우저가 전환 시작점을 잡지 못한다
      setState('entering')
      const frame = requestAnimationFrame(() => {
        setState('open')
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }

    setState('exiting')
    const timer = setTimeout(() => {
      setShouldRender(false)
    }, durationMs)
    return () => {
      clearTimeout(timer)
    }
  }, [open, durationMs])

  return { shouldRender, state }
}
