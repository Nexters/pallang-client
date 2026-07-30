import { cn } from '@/app/_global/_services/cn.service'

import type { HighlightQuote } from '../../_types/readerHighlights.type'

type QuoteIndicatorProps = {
  quotes: HighlightQuote[]
  activeIndex: number
  className?: string
}

export function QuoteIndicator({ quotes, activeIndex, className }: QuoteIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2', className)}>
      {quotes.map((quote, index) => (
        <span
          key={quote.text}
          className={
            // ponytail: 비활성 #c6c6c6은 디자인 변수 미연결 색 — 토큰 추가 시 치환
            index === activeIndex ? 'h-[17px] w-1.5 bg-neutral-900' : 'h-[9px] w-1.5 bg-[#c6c6c6]'
          }
        />
      ))}
    </div>
  )
}
