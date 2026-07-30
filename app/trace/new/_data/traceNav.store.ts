'use client'

import { createContext } from 'react'

import type { TraceStep } from '../_services/traceStepNav.service'

export type TraceNav = {
  /** 단계 그래프상 이전 단계로. 이전이 없으면 이탈 판정으로 넘어간다. */
  goBack: () => void
  goTo: (step: TraceStep) => void
  /** 플로우를 벗어나려는 시도. 오버레이 닫기·즉시 이탈·확인 다이얼로그 중 하나가 된다. */
  requestExit: () => void
  step: TraceStep | null
}

export const TraceNavContext = createContext<TraceNav | null>(null)
