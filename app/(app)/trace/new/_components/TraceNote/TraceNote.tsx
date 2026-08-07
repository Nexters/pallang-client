import type { ComponentPropsWithoutRef, Ref } from 'react'

import { DecoratedQuote } from '@/app/_shared/trace/_components/DecoratedQuote/DecoratedQuote'
import type { Decoration } from '@/app/_shared/trace/_data/decoration.model'

import type { TextRange } from '../../_services/textRange.service'

type TraceNoteProps = Pick<
  ComponentPropsWithoutRef<'p'>,
  'onPointerCancel' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp'
> & {
  decorations: Decoration[]
  /** 효과를 적용하기 전에 골라 둔 범위. 어디에 들어갈지 미리 보여준다. */
  pendingRange?: null | TextRange
  quotedText: string
  /** 드래그 자동 스크롤을 붙일 스크롤 컨테이너. decorate 화면에서만 넘긴다. */
  scrollRef?: Ref<HTMLDivElement>
  /** 드래그로 범위를 고르는 화면에서만 켠다. 켜면 노트 위 드래그가 스크롤로 새지 않는다. */
  selectable?: boolean
}

export function TraceNote({
  decorations,
  pendingRange,
  quotedText,
  scrollRef,
  selectable = false,
  ...handlers
}: TraceNoteProps) {
  return (
    // 시안(2295:5843)의 TraceNote는 높이가 320px로 고정이다. 인용문이 길면 잘리지 않고 안에서 스크롤한다.
    // h-[320px](고정 높이)여야 아래 min-h-full의 퍼센트 기준이 확정된다.
    <div
      ref={scrollRef}
      className="h-[320px] overflow-x-hidden overflow-y-auto rounded-[4px] border border-border-book bg-bg-book-card drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
    >
      {/* min-h-full: 짧으면 세로 중앙, 길면 위부터 스크롤(flex+overflow는 넘칠 때 상단이 잘리므로) */}
      <div className="flex min-h-full items-center px-6 py-10">
        <DecoratedQuote
          {...handlers}
          quotedText={quotedText}
          decorations={decorations}
          pendingRange={pendingRange}
          selectable={selectable}
          // 동그라미 효과는 글자 사방으로 삐져나오는데 가로 스크롤 경계에 잘린다.
          // 음수 마진과 같은 크기의 패딩(-mx-4 px-4)으로 글자 위치는 그대로 두고 그리는 경계만 넓힌다.
          className="text-body-20md -mx-4 w-full whitespace-pre-wrap px-4 text-text-secondary"
        />
      </div>
    </div>
  )
}
