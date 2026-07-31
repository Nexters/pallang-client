import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import type { Decoration } from '../../_data/decoration.model'
import { splitByDecorations } from '../../_services/decoration.service'
import { decorationBrushStyle } from '../../_services/decorationBrush.service'

type DecoratedQuoteProps = Pick<
  ComponentPropsWithoutRef<'p'>,
  'onPointerCancel' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp'
> & {
  className?: string
  decorations: Decoration[]
  /** 효과를 적용하기 전에 골라 둔 범위. 어디에 들어갈지 미리 보여준다. selectable일 때만 그린다. */
  pendingRange?: null | { startOffset: number; endOffset: number }
  quotedText: string
  /** 드래그로 범위를 고르는 화면에서만 켠다. 글자마다 오프셋을 심고 드래그가 스크롤로 새지 않게 한다. */
  selectable?: boolean
}

/** 글자 배치를 바꾸는 속성(padding·border·margin)은 쓰지 않는다 — 드래그로 짚은 위치와
 *  효과가 들어가는 위치가 어긋나면 안 된다. 자국은 전부 배경으로만 그린다. */
const DECORATED_CLASS = 'box-decoration-clone'

/** 글자를 코드 유닛 오프셋과 함께 늘어놓는다 — decorations의 오프셋이 slice 기준이라 맞춰야 한다. */
function toChars(text: string, start: number) {
  const chars: { char: string; offset: number }[] = []
  let cursor = start
  for (const char of text) {
    chars.push({ char, offset: cursor })
    cursor += char.length
  }
  return chars
}

/** 인용문에 꾸미기 효과를 얹어 그린다. 작성(TraceNote)과 조회(QuoteStage·QuotePanel)가 함께 쓴다.
 *  바깥 카드·높이·스크롤은 쓰는 쪽이 정하고 여기서는 글자와 자국만 그린다. */
export function DecoratedQuote({
  className,
  decorations,
  pendingRange,
  quotedText,
  selectable = false,
  ...handlers
}: DecoratedQuoteProps) {
  const segments = splitByDecorations(quotedText, decorations)

  return (
    <p {...handlers} className={cn(className, selectable && 'touch-none select-none')}>
      {segments.map((segment, segmentIndex) => (
        <span
          key={segmentIndex}
          // 적용된 효과를 다시 눌러 색을 바꾸거나 지울 수 있도록 위치를 표시해 둔다
          data-decoration-start={segment.decoration?.startOffset}
          className={segment.decoration ? DECORATED_CLASS : undefined}
          style={segment.decoration ? decorationBrushStyle(segment.decoration) : undefined}
        >
          {/* 글자 단위 span은 드래그 위치를 오프셋으로 되짚을 때만 필요하다 — 조회 화면에서는 달지 않는다 */}
          {selectable
            ? toChars(segment.text, segment.startOffset).map(({ char, offset }) => (
                <span
                  key={offset}
                  data-offset={offset}
                  className={cn(
                    pendingRange &&
                      offset >= pendingRange.startOffset &&
                      offset < pendingRange.endOffset &&
                      'rounded-[2px] bg-interactive-accent/30',
                  )}
                >
                  {char}
                </span>
              ))
            : segment.text}
        </span>
      ))}
    </p>
  )
}
