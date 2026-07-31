import type { TraceDraft } from '../_types/traceDraft.type'
import type { TraceStep } from './traceStepNav.service'

export type TraceExitDecision = 'closeOverlay' | 'confirm' | 'exit'

type ExitInput = {
  draft: TraceDraft
  /** 지금 닫을 수 있는 시트·폼·다이얼로그가 있는지 */
  hasOverlay: boolean
  step: TraceStep | null
}

/** 책 선택만으로는 잃을 것이 없다. 손으로 만든 값이 하나라도 있으면 확인을 받는다. */
function hasUnsavedWork(draft: TraceDraft): boolean {
  return draft.quotedText.length > 0 || draft.decorations.length > 0 || draft.content.length > 0
}

export function resolveExitDecision({ draft, hasOverlay, step }: ExitInput): TraceExitDecision {
  if (hasOverlay) return 'closeOverlay'
  if (step === null || step === 'done') return 'exit'
  // 이미 저장된 흔적이면 남은 draft는 결과 화면용 사본일 뿐이라 잃을 것이 없다.
  if (draft.result !== null) return 'exit'
  return hasUnsavedWork(draft) ? 'confirm' : 'exit'
}
