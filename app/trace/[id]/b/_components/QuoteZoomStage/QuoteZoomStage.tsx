import CautionIcon from '@/app/_global/_components/Icon/assets/caution.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { PageTabs } from '../../../_components/PageTabs/PageTabs'
import { QuoteIndicator } from '../../../_components/QuoteIndicator/QuoteIndicator'
import { TraceHeader } from '../../../_components/TraceHeader/TraceHeader'
import type { Highlight } from '../../../_types/readerHighlights.type'
import styles from './QuoteZoomStage.module.css'

type QuoteZoomStageProps = {
  title: string
  highlights: Highlight[]
  highlight: Highlight
  quoteIndex: number
  isRevealed: boolean
  isCollapsed: boolean
  onSelectHighlight: (highlight: Highlight) => void
  onClickQuote: () => void
}

export function QuoteZoomStage({
  title,
  highlights,
  highlight,
  quoteIndex,
  isRevealed,
  isCollapsed,
  onSelectHighlight,
  onClickQuote,
}: QuoteZoomStageProps) {
  const quote = highlight.quotes[quoteIndex] ?? ''
  const isCovered = highlight.isSpoiler && !isRevealed

  return (
    <div className={styles['stage']}>
      <div className={styles['base']} />
      <div className={styles['sheet']} />
      <div className={styles['banner']} />
      <TraceHeader title={title} className={styles['header']} />
      {!isCollapsed && (
        <div className={styles['tabsClip']}>
          <PageTabs
            highlights={highlights}
            activePage={highlight.page}
            onSelect={onSelectHighlight}
            className={styles['tabs']}
          />
        </div>
      )}
      <button type="button" onClick={onClickQuote} className={styles['card']}>
        <p className={cn(styles['quote'], 'text-body-20md text-text-secondary')}>{quote}</p>
        {isCovered && (
          <span className={styles['cover']}>
            <span className={styles['coverContent']}>
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
