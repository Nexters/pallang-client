'use client'

import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'

import { type TraceNav, TraceNavContext } from '../../_data/traceNav.store'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceOverlay } from '../../_hooks/useTraceOverlay'
import { resolveExitDecision } from '../../_services/traceExit.service'
import {
  nextStepPaths,
  resolveBackTarget,
  resolveStep,
  stepPath,
  type TraceStep,
} from '../../_services/traceStepNav.service'
import { TraceExitDialog } from '../TraceExitDialog/TraceExitDialog'

const HOME_PATH = '/'

/**
 * 플로우 안의 모든 이동을 replace로 처리해 히스토리를 '/ → 현재 단계' 2칸으로 묶는다.
 * push로 쌓으면 뒤로가기가 이전 단계로 갔다가 guard의 replace에 되밀려 제자리에 머문다.
 */
export function TraceNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { dispatch, draft } = useTraceDraft()
  const overlay = useTraceOverlay()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const step = resolveStep(pathname)

  // 현재 단계에 들어서는 순간 다음 단계 route를 미리 받아둔다. 이 페이지들은 서버 데이터
  // fetch가 없어 사실상 정적이라, 프리페치해두면 '다음' 전환이 네트워크 왕복 없이 즉시 된다.
  useEffect(() => {
    if (!step) return
    for (const path of nextStepPaths(step)) router.prefetch(path)
  }, [step, router])

  const leaveFlow = () => {
    setIsConfirmOpen(false)
    dispatch({ type: 'reset' })
    router.replace(HOME_PATH)
  }

  const requestExit = () => {
    const decision = resolveExitDecision({ draft, hasOverlay: overlay.hasOverlay(), step })
    if (decision === 'closeOverlay') {
      overlay.closeTop()
      return
    }
    if (decision === 'confirm') {
      setIsConfirmOpen(true)
      return
    }
    leaveFlow()
  }

  // 하드웨어 back도 닫기 버튼과 같은 판정을 거친다
  useHardwareBack(requestExit)

  const value: TraceNav = {
    goBack: () => {
      if (!step) {
        requestExit()
        return
      }
      const target = resolveBackTarget(step)
      if (target.type === 'exit') {
        requestExit()
        return
      }
      if (target.clearQuote) dispatch({ type: 'clearQuote' })
      router.replace(stepPath(target.step))
    },
    goTo: (next: TraceStep) => {
      router.replace(stepPath(next))
    },
    requestExit,
    step,
  }

  return (
    <TraceNavContext value={value}>
      {children}
      <TraceExitDialog
        open={isConfirmOpen}
        onCancel={() => {
          setIsConfirmOpen(false)
        }}
        onConfirm={leaveFlow}
      />
    </TraceNavContext>
  )
}
