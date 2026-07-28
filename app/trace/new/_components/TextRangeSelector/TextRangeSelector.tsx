'use client'

import { cn } from '@/app/_global/_services/cn.service'

import { useTextRangeSelection } from '../../_hooks/useTextRangeSelection'
import type { TextRange } from '../../_services/textRange.service'

type TextRangeSelectorProps = {
  text: string
  onSelect: (range: TextRange) => void
}

export function TextRangeSelector({ text, onSelect }: TextRangeSelectorProps) {
  const { range, handlers } = useTextRangeSelection(onSelect)

  return (
    <p
      {...handlers}
      className="text-body-20md whitespace-pre-wrap touch-none select-none text-text-secondary"
    >
      {Array.from(text).map((char, index) => (
        <span
          key={index}
          data-offset={index}
          className={cn(
            range && index >= range.startOffset && index < range.endOffset && 'bg-orange-200',
          )}
        >
          {char}
        </span>
      ))}
    </p>
  )
}
