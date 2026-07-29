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
      <div className={styles['base']} />
      <div className={styles['sheet']} />
      <div className={styles['banner']} />
      <TraceHeader title={title} className={styles['header']} />
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
        <p className={cn(styles['quote'], 'text-body-20md text-text-secondary')}>{quote}</p>
        {isCovered && (
          <span className={styles['cover']}>
            <CautionIcon className={styles['coverIcon']} />
            <span className={styles['coverText']}>
              <span
                className={cn(styles['coverTitle'], isCollapsed && styles['coverTitleCollapsed'])}
              >
                스포일러가 포함되어있어요!
              </span>
              <span
                className={cn(
                  styles['coverSubtitle'],
                  isCollapsed && styles['coverSubtitleCollapsed'],
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
