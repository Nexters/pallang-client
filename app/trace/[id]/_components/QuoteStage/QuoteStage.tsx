import CautionIcon from '@/app/_global/_components/Icon/assets/caution.svg'
import { cn } from '@/app/_global/_services/cn.service'

import type { QuoteStageProps } from '../../_types/readerHighlights.type'
import { PageTabs } from '../PageTabs/PageTabs'
import { QuoteIndicator } from '../QuoteIndicator/QuoteIndicator'
import { TraceHeader } from '../TraceHeader/TraceHeader'
import styles from './QuoteStage.module.css'

export function QuoteStage({
  title,
  pages,
  highlight,
  quoteIndex,
  isRevealed,
  isCollapsed,
  onSelectPage,
  onLoadMorePages,
  onClickQuote,
}: QuoteStageProps) {
  const quote = highlight.quotes[quoteIndex] ?? ''
  const isCovered = highlight.isSpoiler && !isRevealed

  return (
    <div className={styles['stage']}>
      <div className="absolute inset-0 bg-bg-book-card" />
      {/* 펼친 상태 흰 배경 — 진행에 따라 걷힌다 */}
      <div className="absolute inset-0 bg-bg-default opacity-[var(--inv)]" />
      <div className={styles['banner']} />
      <TraceHeader title={title} className="absolute inset-x-0 top-0" />
      {/* 완전히 투명해진 뒤에도 초점이 남지 않도록 전환이 끝나면 언마운트한다 */}
      {!isCollapsed && (
        <div className={styles['tabsClip']}>
          <PageTabs
            pages={pages}
            activePage={highlight.page}
            onSelect={onSelectPage}
            onLoadMore={onLoadMorePages}
            className={styles['tabs']}
          />
        </div>
      )}
      <button type="button" onClick={onClickQuote} className={styles['card']}>
        <p className="min-h-0 flex-1 overflow-hidden text-body-20md text-text-secondary">{quote}</p>
        {isCovered && (
          <span className={styles['cover']}>
            <CautionIcon className={styles['coverIcon']} />
            <span className="flex flex-col gap-1 text-center">
              {/* 가변 폰트가 아니라 굵기는 보간되지 않는다 — 전환이 끝난 시점에만 바꾼다 */}
              <span
                className={cn(styles['coverTitle'], isCollapsed ? 'font-semibold' : 'font-bold')}
              >
                스포일러가 포함되어있어요!
              </span>
              <span
                className={cn(
                  'text-body-14md leading-[1.3] tracking-[-0.04em] opacity-70',
                  isCollapsed && 'font-normal',
                )}
              >
                누르면 확인 할 수 있어요
              </span>
            </span>
          </span>
        )}
      </button>
      <QuoteIndicator
        quotes={highlight.quotes}
        activeIndex={quoteIndex}
        className={styles['indicator']}
      />
    </div>
  )
}
