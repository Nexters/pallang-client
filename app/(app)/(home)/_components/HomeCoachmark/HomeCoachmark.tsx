'use client'

import { useEffect, useRef, useState } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { consumeHomeCoachmarkPending } from '@/app/_shared/onboarding/_services/coachmarkPending.service'

import { HomeCoachmarkOverlay } from '../HomeCoachmarkOverlay/HomeCoachmarkOverlay'

/**
 * 온보딩을 막 끝내고 홈에 도착했을 때 한 번만 뜨는 사용법 안내.
 *
 * 뜰 조건만 여기서 판정하고 화면은 오버레이가 그린다. 둘을 나눈 이유는 오버레이가
 * 하드웨어 back을 가로채기 때문이다 — 항상 마운트돼 있으면 코치마크가 닫힌 뒤에도
 * 홈에서 back을 계속 삼켜 앱이 안 닫힌다.
 */
export function HomeCoachmark() {
  const [isOpen, setIsOpen] = useState(false)
  const isPendingRef = useRef<boolean | null>(null)
  const transition = useExitTransition(isOpen, MOTION_DURATION.fast)

  // 프리렌더에는 sessionStorage가 없어 effect에서 읽고, setState는 다음 틱으로 넘긴다
  // (동기로 부르면 set-state-in-effect의 연쇄 렌더 경고에 걸린다 — MyPageContent와 같은 처방).
  // 예약을 읽는 순간 지우므로 판정은 ref에 담아 둔다. StrictMode가 effect를 두 번 돌려도
  // 두 번째 실행이 '이미 소비돼 없음'으로 읽어 코치마크를 통째로 삼키는 일이 없다.
  useEffect(() => {
    isPendingRef.current ??= consumeHomeCoachmarkPending()
    if (!isPendingRef.current) return undefined

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 0)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!transition.shouldRender) return null

  return (
    <HomeCoachmarkOverlay
      state={transition.state}
      onClose={() => {
        setIsOpen(false)
      }}
    />
  )
}
