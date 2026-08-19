'use client'

import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

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
 * 플로우 안의 모든 이동을 replace로 처리해 히스토리를 '들어온 자리 → 현재 단계' 2칸으로 묶는다.
 * push로 쌓으면 뒤로가기가 이전 단계로 갔다가 guard의 replace에 되밀려 제자리에 머문다.
 * 이 2칸 구조 덕분에 플로우를 벗어날 때 한 칸만 되감으면 들어온 자리로 정확히 돌아간다.
 */
export function TraceNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { dispatch, draft } = useTraceDraft()
  const overlay = useTraceOverlay()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  // 나가기를 건 경로. 아직 그 자리에 서 있는 동안만 '나가는 중'이라, 이동이 성사되면 저절로 풀린다
  // — 되살아나 플로우를 다시 걷게 돼도 가드가 멈춘 채로 남지 않는다.
  const [exitingFrom, setExitingFrom] = useState<string | null>(null)
  // 들어서기 전 화면이 앱 안에 있었는지. 씨앗을 소비한 화면이 알려준다(TraceSourceView).
  const isReturnableRef = useRef(false)

  const step = resolveStep(pathname)

  // 현재 단계에 들어서는 순간 다음 단계 route를 미리 받아둔다. 이 페이지들은 서버 데이터
  // fetch가 없어 사실상 정적이라, 프리페치해두면 '다음' 전환이 네트워크 왕복 없이 즉시 된다.
  useEffect(() => {
    if (!step) return
    for (const path of nextStepPaths(step)) router.prefetch(path)
  }, [step, router])

  const markReturnable = useCallback(() => {
    isReturnableRef.current = true
  }, [])

  /**
   * 들어온 자리로 되돌릴 수 있는지. 두 조건을 모두 본다.
   * - 씨앗을 물고 들어왔는가(흔적 보기의 '의견 남기기'·'기록'은 push로만 이 플로우를 연다)
   * - 히스토리에 되감을 칸이 남아 있는가 — 씨앗 URL을 직접 열면 되감을 곳이 앱 밖이다
   */
  const canReturn = () => isReturnableRef.current && window.history.length > 1

  const leaveFlow = () => {
    setIsConfirmOpen(false)
    // 초안을 비우기 전에 알린다. 순서가 뒤바뀌면 가드가 빈 초안을 보고 첫 화면(`/trace/new`)으로
    // 되밀어, 방금 건 이탈 이동을 덮어쓴다.
    setExitingFrom(pathname)
    dispatch({ type: 'reset' })
    // 저장까지 마친 뒤라면 들어온 자리는 방금 남긴 흔적을 아직 모르는 목록이다 — 홈으로 보낸다.
    if (step !== 'done' && canReturn()) {
      router.back()
      return
    }
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
    isLeaving: exitingFrom === pathname,
    markReturnable,
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
