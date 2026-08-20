import type { Ref } from 'react'

type SheetHandleProps = {
  /** 손잡이 요소를 끌어 쓰는 쪽(드래그 판정)에 알린다 */
  ref?: Ref<HTMLButtonElement>
  /** 누르면 무엇이 일어나는지 — 시트마다 다르다(펼치기·접기·닫기) */
  label: string
  /** 두 높이를 오가는 시트에서만 넘긴다. 닫히기만 하는 시트에 달면 거짓말이 된다 */
  isExpanded?: boolean
  onSelect: () => void
}

/** 시트 위쪽 손잡이 — 끌어서 높이를 바꾸거나 닫는다. 누르는 것도 같은 일을 한다.
    바텀시트가 두 겹으로 겹치는 화면(흔적 보기)에서 두 시트가 같은 손잡이를 쓴다. */
export function SheetHandle({ ref, label, isExpanded, onSelect }: SheetHandleProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-expanded={isExpanded}
      onClick={onSelect}
      // 손잡이 위에서의 세로 드래그는 시트가 가져간다 — 안쪽 목록이 함께 스크롤되지 않도록
      className="flex w-full shrink-0 cursor-pointer touch-none justify-center pt-4"
    >
      <span className="h-[3px] w-8 rounded-full bg-bg-tertiary" />
    </button>
  )
}
