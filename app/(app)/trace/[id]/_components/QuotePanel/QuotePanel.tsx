import { DecoratedQuote } from '@/app/_shared/trace/_components/DecoratedQuote/DecoratedQuote'

import type { HighlightQuote } from '../../_types/readerHighlights.type'

/** 의견 상세에서 인용문만 보여주는 고정 패널. 흔적 목록 화면의 전환형 패널은 QuoteStage가 담당한다 */
export function QuotePanel({ quote }: { quote: HighlightQuote | undefined }) {
  return (
    <div className="flex h-[270px] shrink-0 flex-col bg-bg-book-card px-6 py-8">
      {/* 동그라미 효과가 글자 사방으로 삐져나오는 만큼(-m-4 p-4) 그리는 경계만 넓힌다 */}
      <DecoratedQuote
        quotedText={quote?.text ?? ''}
        decorations={quote?.decorations ?? []}
        className="text-body-20md -m-4 min-h-0 flex-1 overflow-hidden p-4 text-text-secondary"
      />
    </div>
  )
}
