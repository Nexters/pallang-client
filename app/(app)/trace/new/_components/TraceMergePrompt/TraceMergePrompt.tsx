'use client'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useSimilarPassageCheck } from '../../_hooks/useSimilarPassageCheck'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import type { TraceStep } from '../../_services/traceStepNav.service'
import { MergeDialog } from '../MergeDialog/MergeDialog'

/**
 * 이미 있는 대목과 겹치는지 묻는 층. 화면에 자리를 차지하지 않고 필요할 때만 다이얼로그를 띄운다.
 *
 * `at`이 지금 서 있는 단계와 같을 때만 묻는다 — Next가 지나온 단계를 감춰 둘 뿐 언마운트하지
 * 않기 때문에, 이 판단이 없으면 감춰진 화면의 사본까지 같이 물어 요청이 두 번 나간다.
 */
export function TraceMergePrompt({ at }: { at: TraceStep }) {
  const { draft } = useTraceDraft()
  const { step } = useTraceNav()
  const { candidate, dismiss, merge } = useSimilarPassageCheck(step === at)

  // 다이얼로그가 떠 있는 동안에는 뒤로가기가 화면을 나가는 대신 다이얼로그만 닫는다
  useOverlayBackGuard(candidate !== null, dismiss)

  return (
    <MergeDialog
      open={candidate !== null}
      myQuote={draft.quotedText}
      candidateQuote={candidate?.quotedText ?? ''}
      onMerge={merge}
      onSeparate={dismiss}
    />
  )
}
