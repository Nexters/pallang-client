/* 헤더 쪽 선택기(PagePicker)의 쪽 번호 ↔ 선택 값 왕복.
   base-ui Select는 값을 문자열로만 다뤄서 변환이 트리거·항목·라벨·onValueChange 네 자리에 흩어진다.
   한 곳으로 모아 라벨 표기('7p')와 값 표기('7')가 자리마다 갈리지 않게 한다. */

/** 화면에 보이는 쪽 표기 */
export function formatPageLabel(page: number): string {
  return `${String(page)}p`
}

/** Select가 다루는 값 표기 */
export function toPageValue(page: number): string {
  return String(page)
}

/** 고른 값을 쪽 번호로 되돌린다 */
export function parsePageValue(value: string): number {
  return Number(value)
}

/** 트리거에 표시할 값 — 아직 정해진 쪽이 없으면 null(base-ui의 '선택 없음') */
export function toSelectedValue(page: number | undefined): string | null {
  return page === undefined ? null : toPageValue(page)
}

/** 라벨은 렌더된 항목이 아니라 이 목록에서 찾는다 —
    현재 쪽을 목록에서 빼고 그려도 트리거 표시는 그대로다.
    보고 있는 쪽이 아직 안 받은 묶음에 있어 목록에 없을 수도 있다(딥링크) —
    그때도 트리거가 빈 칸으로 서지 않도록 앞에 끼워 넣는다. */
export function toPageOptions(
  pages: readonly number[],
  activePage?: number,
): { label: string; value: string }[] {
  const listed =
    activePage !== undefined && !pages.includes(activePage) ? [activePage, ...pages] : pages
  return listed.map((page) => ({ label: formatPageLabel(page), value: toPageValue(page) }))
}
