import { useRef } from 'react'

import { DecoratedQuote } from '@/app/_shared/trace/_components/DecoratedQuote/DecoratedQuote'

import {
  BAND_HEIGHT,
  CARD_HEIGHT,
  CARD_TOP,
  CARD_WIDTH,
  PAGER_TOP,
  px,
  STAGE_HEIGHT,
} from '../../_data/quoteStage.constant'
import { useQuoteSwipe } from '../../_hooks/useQuoteSwipe'
import { isSpoilerCovered } from '../../_services/spoiler.service'
import type { QuoteStageProps } from '../../_types/readerHighlights.type'
import { QuoteLoadError } from '../QuoteLoadError/QuoteLoadError'
import { QuotePager } from '../QuotePager/QuotePager'
import { QuoteSpoilerCover } from '../QuoteSpoilerCover/QuoteSpoilerCover'
import { TraceHeader } from '../TraceHeader/TraceHeader'

/** 무대의 모든 y좌표는 노치 인셋 위에 얹힌다 — 시안의 상태바 44px 자리를 인셋이 대신한다 */
const belowSafeArea = (offset: number) => `calc(var(--safe-top) + ${px(offset)})`

/** 화면 위쪽 고정 무대 — 주황 밴드, 흰 면, 그 경계에 걸친 포스트잇 카드, 카드 아래 대목 페이저.
    스크롤에 반응하지 않는다. 움직이는 것은 아래 어두운 패널뿐이다(TraceScreen). */
export function QuoteStage({
  title,
  scopeLabel,
  pageNav,
  highlight,
  quoteIndex,
  isRevealed,
  stageError,
  canSwipe,
  onBack,
  onClickQuote,
  onSwipeQuote,
}: QuoteStageProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  useQuoteSwipe(cardRef, onSwipeQuote)
  const activeQuote = highlight.quotes[quoteIndex]
  // 가림막은 지금 보고 있는 대목이 스포일러일 때만 씌운다 — 같은 페이지의 다른 대목은 영향을 주지 않는다
  const isCovered = isSpoilerCovered({ isSpoiler: activeQuote?.isSpoiler, isRevealed })

  return (
    // 밴드 아래로 드러나는 흰 면이 이 컨테이너의 배경이다
    <div className="relative bg-bg-default" style={{ height: belowSafeArea(STAGE_HEIGHT) }}>
      {/* 주황 밴드 — 노치 뒤까지 깔리도록 인셋만큼 더 내려온다 */}
      <div
        className="absolute inset-x-0 top-0 bg-interactive-accent"
        style={{ height: belowSafeArea(BAND_HEIGHT) }}
      />
      {/* 헤더는 밴드 위에 얹힌다 — 글자·아이콘은 주황 위에서도 시안대로 어두운 색 그대로다 */}
      <TraceHeader
        title={title}
        scopeLabel={scopeLabel}
        onBack={onBack}
        pageNav={pageNav}
        className="absolute inset-x-0 top-(--safe-top) h-11 py-0"
      />
      {/* 포스트잇 카드 — 밴드와 흰 면의 경계를 가로질러 걸친다.
          겉모습(테두리·모서리·그림자)은 흔적 남기기 화면의 TraceNote와 같은 한 벌이다 */}
      <div
        ref={cardRef}
        className="absolute left-1/2 flex -translate-x-1/2 flex-col rounded-[4px] border border-border-book bg-bg-book-card px-6 py-10 text-left drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
        style={{
          top: belowSafeArea(CARD_TOP),
          width: px(CARD_WIDTH),
          height: px(CARD_HEIGHT),
        }}
      >
        {stageError?.isError ? (
          <QuoteLoadError onRetry={stageError.retry} />
        ) : (
          /* 동그라미 효과는 글자 사방으로 삐져나온다(paddingBlock 0.3em=6px인데 line-height 1.5의
             반각 여백은 5px뿐이라 첫 줄·끝 줄이 잘린다). 음수 마진과 같은 크기의 패딩으로
             글자 위치와 차지하는 자리는 그대로 두고 overflow에 잘리는 경계만 넓힌다 */
          <DecoratedQuote
            quotedText={activeQuote?.text ?? ''}
            decorations={activeQuote?.decorations ?? []}
            className="-m-4 min-h-0 flex-1 overflow-hidden p-4 text-body-20md text-text-secondary"
          />
        )}
        {isCovered && <QuoteSpoilerCover onReveal={onClickQuote} />}
      </div>
      <QuotePager
        index={quoteIndex}
        total={highlight.quotes.length}
        canSwipe={canSwipe}
        onMove={onSwipeQuote}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: belowSafeArea(PAGER_TOP) }}
      />
    </div>
  )
}
