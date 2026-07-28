import type { ReactNode } from 'react'

import { splitByDecorations } from '../../_services/decoration.service'
import type { DraftDecoration, DraftEffectType } from '../../_types/traceDraft.type'

type TraceNoteProps = {
  quotedText: string
  decorations: DraftDecoration[]
  children?: ReactNode
}

const effectClassMap: Record<DraftEffectType, string> = {
  HIGHLIGHT: 'rounded-[2px] px-0.5',
  WAVY: 'underline decoration-wavy decoration-2 underline-offset-4',
  UNDERLINE: 'underline decoration-2 underline-offset-4',
}

export function TraceNote({ quotedText, decorations, children }: TraceNoteProps) {
  return (
    <div className="relative rounded-[4px] border border-border-book bg-bg-book-card px-6 py-8 drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]">
      <p className="text-body-20md whitespace-pre-wrap text-text-secondary">
        {splitByDecorations(quotedText, decorations).map((segment, index) =>
          segment.decoration ? (
            <span
              key={index}
              className={effectClassMap[segment.decoration.effectType]}
              style={
                segment.decoration.effectType === 'HIGHLIGHT'
                  ? { backgroundColor: segment.decoration.color }
                  : { textDecorationColor: segment.decoration.color }
              }
            >
              {segment.text}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      {children}
    </div>
  )
}
