'use client'

import { createContext } from 'react'

import type { TraceStep } from '../_services/traceStepNav.service'

export type TraceNav = {
  /** 단계 그래프상 이전 단계로. 이전이 없으면 이탈 판정으로 넘어간다. */
  goBack: () => void
  goTo: (step: TraceStep) => void
  /**
   * 플로우를 벗어나는 중. 이때 초안은 이미 비워진 뒤라 단계 가드가 끼어들면 안 된다
   * — 빈 초안을 보고 첫 화면으로 되밀어 나가려던 이동을 덮어쓴다.
   */
  isLeaving: boolean
  /**
   * 이 플로우에 들어서기 전 화면이 앱 안에 있다고 표시한다.
   * 표시가 있으면 나갈 때 홈이 아니라 그 자리로 되돌린다.
   */
  markReturnable: () => void
  /** 완료 화면처럼 목적지가 이미 정해진 이탈. 초안을 비우고 가드를 물린 채 이동한다. */
  leaveTo: (path: string) => void
  /** 플로우를 벗어나려는 시도. 오버레이 닫기·즉시 이탈·확인 다이얼로그 중 하나가 된다. */
  requestExit: () => void
  step: TraceStep | null
}

export const TraceNavContext = createContext<TraceNav | null>(null)
