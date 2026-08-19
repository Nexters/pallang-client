import { useRef } from 'react'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { cn } from '@/app/_global/_services/cn.service'
import { DecoratedQuote } from '@/app/_shared/trace/_components/DecoratedQuote/DecoratedQuote'

import { useQuoteSwipe } from '../../_hooks/useQuoteSwipe'
import { isSpoilerCovered } from '../../_services/spoiler.service'
import type { QuoteStageProps } from '../../_types/readerHighlights.type'
import { QuoteSpoilerCover } from '../QuoteSpoilerCover/QuoteSpoilerCover'
import { QuoteStageBackdrop } from '../QuoteStageBackdrop/QuoteStageBackdrop'
import { TraceHeader } from '../TraceHeader/TraceHeader'
import styles from './QuoteStage.module.css'

export function QuoteStage({
  title,
  pageNav,
  highlight,
  quoteIndex,
  isRevealed,
  isCollapsed,
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
    <div className={cn(styles['stage'], 'absolute inset-x-0 top-0')}>
      <QuoteStageBackdrop />
      {/* 대목 이동은 카드 위 좌우 스와이프와 카드 안 화살표가 함께 맡는다.
          카드는 접히며 헤더 뒤까지 올라오므로 헤더보다 먼저 그린다 — 순서가 뒤집히면 헤더가 가려진다 */}
      <div
        ref={cardRef}
        className={cn(
          styles['card'],
          styles['cardSurface'],
          'absolute flex flex-col bg-bg-book-card px-6 text-left',
        )}
      >
        {/* 동그라미 효과는 글자 사방으로 삐져나온다(paddingBlock 0.3em=6px인데 line-height 1.5의
            반각 여백은 5px뿐이라 첫 줄·끝 줄이 잘린다). 음수 마진과 같은 크기의 패딩으로
            글자 위치와 차지하는 자리는 그대로 두고 overflow에 잘리는 경계만 넓힌다 */}
        <DecoratedQuote
          quotedText={activeQuote?.text ?? ''}
          decorations={activeQuote?.decorations ?? []}
          className="text-body-20md -m-4 min-h-0 flex-1 overflow-hidden p-4 text-text-secondary"
        />
        {/* ponytail: 시안의 화살표는 아직 스크린샷을 붙여둔 자리라 에셋이 없다.
            글리프가 가장 가까운 back/next를 쓰고, 실제 아이콘이 나오면 갈아끼운다 */}
        <div className="absolute right-8 bottom-8 flex items-center gap-2.5">
          <button
            type="button"
            aria-label="이전 대목"
            onClick={() => {
              onSwipeQuote('prev')
            }}
          >
            <BackIcon width={14} height={14} className="text-text-secondary opacity-40" />
          </button>
          <button
            type="button"
            aria-label="다음 대목"
            onClick={() => {
              onSwipeQuote('next')
            }}
          >
            <NextIcon width={14} height={14} className="text-text-secondary" />
          </button>
        </div>
        {isCovered && <QuoteSpoilerCover isCollapsed={isCollapsed} onReveal={onClickQuote} />}
      </div>
      {/* 헤더 높이는 전환 좌표계가 쓰는 --header-height 그대로다 — 리터럴로 다시 적으면 어긋난다 */}
      <TraceHeader
        title={title}
        onBack={onBack}
        pageNav={pageNav}
        className="absolute inset-x-0 top-(--safe-top) h-(--header-height) py-0"
      />
    </div>
  )
}
