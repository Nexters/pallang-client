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
  const activeQuote = highlight.quotes[quoteIndex]
  // 가림막은 지금 보고 있는 대목이 스포일러일 때만 씌운다 — 같은 페이지의 다른 대목은 영향을 주지 않는다
  const isCovered = Boolean(activeQuote?.isSpoiler) && !isRevealed

  return (
    <div className={cn(styles['stage'], 'absolute inset-x-0 top-0')}>
      <div className="absolute inset-0 bg-bg-book-card" />
      {/* 펼친 상태 흰 배경 — 진행에 따라 걷힌다 */}
      <div className="absolute inset-0 bg-bg-default opacity-[var(--inv)]" />
      <div className={cn(styles['banner'], 'absolute inset-x-0 top-0 bg-orange-500')} />
      <TraceHeader title={title} className="absolute inset-x-0 top-(--safe-top)" />
      {/* 완전히 투명해진 뒤에도 초점이 남지 않도록 전환이 끝나면 언마운트한다 */}
      {!isCollapsed && (
        <div
          className={cn(
            styles['tabsClip'],
            'absolute inset-x-0 top-[calc(var(--safe-top)+var(--header-height))] overflow-hidden',
          )}
        >
          <PageTabs
            pages={pages}
            activePage={highlight.page}
            onSelect={onSelectPage}
            onLoadMore={onLoadMorePages}
            className={styles['tabs']}
          />
        </div>
      )}
      <button
        type="button"
        onClick={onClickQuote}
        className={cn(styles['card'], 'absolute flex flex-col bg-bg-book-card px-6 text-left')}
      >
        <p className="min-h-0 flex-1 overflow-hidden text-body-20md text-text-secondary">
          {activeQuote?.text ?? ''}
        </p>
        {isCovered && (
          <span
            className={cn(
              styles['cover'],
              'absolute inset-0 flex flex-col items-center justify-center rounded-[inherit] bg-bg-book-card/70 backdrop-blur-[9px]',
            )}
          >
            {/* ponytail: #3e3e3e는 디자인 변수 미연결 색 — 토큰 추가 시 치환 */}
            <CautionIcon className={cn(styles['coverIcon'], 'text-[#3e3e3e]')} />
            <span className="flex flex-col gap-1 text-center">
              {/* 가변 폰트가 아니라 굵기는 보간되지 않는다 — 전환이 끝난 시점에만 바꾼다 */}
              <span
                className={cn(
                  styles['coverTitle'],
                  'leading-[1.35] tracking-[-0.04em]',
                  isCollapsed ? 'font-semibold' : 'font-bold',
                )}
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
        className={cn(styles['indicator'], 'absolute inset-x-0')}
      />
    </div>
  )
}
