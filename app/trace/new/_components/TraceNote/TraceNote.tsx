import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import { splitByDecorations } from '../../_services/decoration.service'
import { decorationBrushStyle } from '../../_services/decorationBrush.service'
import type { TextRange } from '../../_services/textRange.service'
import type { DraftDecoration } from '../../_types/traceDraft.type'

type TraceNoteProps = Pick<
  ComponentPropsWithoutRef<'p'>,
  'onPointerCancel' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp'
> & {
  decorations: DraftDecoration[]
  /** 효과를 적용하기 전에 골라 둔 범위. 어디에 들어갈지 미리 보여준다. */
  pendingRange?: null | TextRange
  quotedText: string
  /** 드래그로 범위를 고르는 화면에서만 켠다. 켜면 노트 위 드래그가 스크롤로 새지 않는다. */
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

export function TraceNote({
  decorations,
  pendingRange,
  quotedText,
  selectable = false,
  ...handlers
}: TraceNoteProps) {
  const segments = splitByDecorations(quotedText, decorations)

  return (
    // 시안(2295:5843)의 TraceNote는 높이가 320px로 고정이라 인용문이 길면 잘린다
    <div className="flex max-h-[320px] min-h-[320px] items-center justify-center overflow-hidden rounded-[4px] border border-border-book bg-bg-book-card px-6 py-10 drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]">
      <p
        {...handlers}
        className={cn(
          'text-body-20md min-w-px flex-1 overflow-hidden whitespace-pre-wrap text-text-secondary',
          // 동그라미 효과는 글자 줄 위아래로 삐져나오는데 이 박스의 overflow-hidden에 잘린다.
          // 음수 마진과 같은 크기의 패딩으로 글자 위치는 그대로 두고 잘리는 경계만 넓힌다.
          // (z-index로는 안 된다 — overflow는 쌓임 순서와 무관하게 잘라낸다.)
          '-my-3 h-[calc(100%+1.5rem)] py-3',
          selectable && 'touch-none select-none',
        )}
      >
        {segments.map((segment, segmentIndex) => (
          <span
            key={segmentIndex}
            // 적용된 효과를 다시 눌러 색을 바꾸거나 지울 수 있도록 위치를 표시해 둔다
            data-decoration-start={segment.decoration?.startOffset}
            className={segment.decoration ? DECORATED_CLASS : undefined}
            style={segment.decoration ? decorationBrushStyle(segment.decoration) : undefined}
          >
            {toChars(segment.text, segment.startOffset).map(({ char, offset }) => (
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
            ))}
          </span>
        ))}
      </p>
    </div>
  )
}
