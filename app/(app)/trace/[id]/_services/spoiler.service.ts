/* 스포일러 가림막 판정 — 대목 단위다(#49).
   같은 조건을 세 곳(스테이지 가림막·흔적 목록 블러·카드 탭 해제)이 함께 쓰므로 판정은 여기에만 둔다.
   손으로 베껴 쓰면 한쪽만 바뀌어, 원문은 열렸는데 목록은 가려진 채 남는 식으로 조용히 어긋난다. */

type SpoilerState = {
  /** 대목이 아직 도착하지 않았으면 undefined — 그때는 가리지 않는다 */
  isSpoiler: boolean | undefined
  /** 해제는 페이지 단위로 유지된다(useHighlightViewer) */
  isRevealed: boolean
}

/** 지금 보고 있는 대목을 가림막으로 덮어야 하는가 */
export function isSpoilerCovered({ isSpoiler, isRevealed }: SpoilerState): boolean {
  return Boolean(isSpoiler) && !isRevealed
}
