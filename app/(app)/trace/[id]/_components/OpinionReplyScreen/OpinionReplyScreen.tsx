import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { cn } from '@/app/_global/_services/cn.service'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'

type OpinionReplyScreenProps = {
  trace: Trace
  state: ExitTransitionState
}

/** 의견 시트 안에서 목록 위로 밀려 들어오는 답글 화면(디자인 202:7346) */
export function OpinionReplyScreen({ trace, state }: OpinionReplyScreenProps) {
  return (
    <div
      data-state={state}
      aria-label="답글 상세"
      className={cn(
        'absolute inset-0 z-1 flex flex-col bg-bg-dark',
        'transition-transform duration-normal ease-enter',
        'data-[state=entering]:translate-x-full data-[state=exiting]:translate-x-full',
        'data-[state=exiting]:ease-exit',
        // 슬라이드 아웃 동안 클릭이 죽은 화면에 먹히지 않게 흘려보낸다
        'data-[state=exiting]:pointer-events-none',
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <TraceItem trace={trace} isContentClamped={false} />
        <TraceCommentSection opinionId={trace.opinionId} />
      </div>
      <TraceCommentComposer opinionId={trace.opinionId} variant="sheet" />
    </div>
  )
}
