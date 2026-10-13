type SheetHandleProps = {
  /** 누르면 무엇이 일어나는지 — 시트마다 다르다(펼치기·접기·닫기) */
  label: string
  /** 두 높이를 오가는 시트에서만 넘긴다. 닫히기만 하는 시트에 달면 거짓말이 된다 */
  isExpanded?: boolean
  onSelect: () => void
}

/** 시트 위쪽 손잡이 — 끌거나 눌러서 높이를 바꾸거나 닫는다. data-sheet-handle은 useSheetDrag의 시작점 표식 */
export function SheetHandle({ label, isExpanded, onSelect }: SheetHandleProps) {
  return (
    <button
      type="button"
      data-sheet-handle
      aria-label={label}
      aria-expanded={isExpanded}
      onClick={onSelect}
      // 손잡이 위에서의 세로 드래그는 시트가 가져간다 — 안쪽 목록이 함께 스크롤되지 않도록
      className="relative flex w-full shrink-0 cursor-pointer touch-none justify-center pt-4"
    >
      <span className="h-[3px] w-8 rounded-full bg-bg-tertiary" />
      {/* 실제 누를 수 있는 곳이 pt-4 + 3px 바 = 19px뿐이라 잡기 어렵다(#372).
          레이아웃·시각은 그대로 두고 바 둘레의 히트만 32px 높이로 넓힌다 — 폭을 w-24로
          한정해 헤더 양끝의 닫기·정렬 조작을 가리지 않고, 세로 드래그도 여기서 시작할 수
          있도록 touch-none을 같이 준다(버튼의 touch-action은 상속되지 않는다). */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-1/2 h-8 w-24 -translate-x-1/2 touch-none"
      />
    </button>
  )
}
