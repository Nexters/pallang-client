'use client'

import { useEffect, useState } from 'react'

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
  const [prevOpen, setPrevOpen] = useState(open)
  const [shouldRender, setShouldRender] = useState(open)
  // 처음부터 열린 채 마운트되면 등장 전환을 건너뛴다 — 화면 진입 때 깜빡이지 않게.
  const [state, setState] = useState<ExitTransitionState>(open ? 'open' : 'exiting')

  // 렌더 도중의 setState — React가 권하는 "prop이 바뀔 때 상태 조정하기" 패턴이다.
  // effect로 미루면 이전 state로 한 프레임이 그려진 뒤에야 바뀌어 깜빡인다.
  // 마운트 시점에는 prevOpen === open이라 이 분기를 타지 않으므로 등장 전환을 건너뛴다.
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setShouldRender(true)
      // 마운트와 같은 프레임에 최종 스타일을 주면 브라우저가 전환 시작점을 잡지 못한다
      setState('entering')
    } else {
      setState('exiting')
    }
  }

  useEffect(() => {
    if (state === 'entering') {
      const frame = requestAnimationFrame(() => {
        setState('open')
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }
    if (state === 'exiting') {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, durationMs)
      return () => {
        clearTimeout(timer)
      }
    }
    // state === 'open'일 때는 예약할 다음 단계가 없다.
    // noImplicitReturns 때문에 명시적으로 undefined를 반환한다.
    return undefined
  }, [state, durationMs])

  return { shouldRender, state }
}
