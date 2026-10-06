import { type ReactNode, useRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import { useHasMoreBelow } from '../../_hooks/useHasMoreBelow'

type QuoteScrollerProps = {
  children: ReactNode
}

/** 포스트잇 카드 안의 인용문 스크롤 영역(#418).
    동그라미 효과는 글자 사방으로 삐져나온다(가로 marginInline -0.7em=14px, 세로 paddingBlock
    0.3em=6px인데 line-height 1.5의 반각 여백은 5px뿐이라 첫 줄이 잘린다). 음수 마진과 같은
    크기의 패딩으로 글자 위치와 차지하는 자리는 그대로 두고 잘리는 경계만 넓힌다.
    아래쪽만 빼는 이유: overflow가 자르는 경계는 패딩 박스라, 아래로 넓히면 넘치는 인용문의
    다음 줄이 딱 잘리지 않고 카드 여백으로 새어 나온다(#148).
    넘치면 마지막 줄이 글자 중간에서 잘리므로, 아래에 글이 남은 동안만 끝 한 줄(30px = line-height)을
    흐려 스크롤할 글이 있다는 신호로 바꾼다. 끝까지 내리면 걷힌다. */
export function QuoteScroller({ children }: QuoteScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isMoreBelow = useHasMoreBelow(scrollRef)

  return (
    <div
      ref={scrollRef}
      className={cn(
        'scrollbar-none -mx-4 -mt-4 min-h-0 flex-1 overflow-y-auto px-4 pt-4',
        isMoreBelow && '[mask-image:linear-gradient(to_bottom,#000_calc(100%-30px),transparent)]',
      )}
    >
      {children}
    </div>
  )
}
