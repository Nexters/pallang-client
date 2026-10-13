/**
 * 책 상세 TopBar 오른쪽 끝의 `편집` 알약.
 *
 * ponytail: 누른 뒤 화면이 시안 어디에도 없다. 자리만 시안대로 잡고 죽여 둔다.
 * 편집 화면이 정해지면 disabled만 걷어내고 onClick을 달면 된다.
 *
 * 본 화면과 골격(BookDetailSkeleton)이 같은 조각을 쓴다 — 한쪽에만 있으면
 * 프리렌더 셸에서 스트림이 도착하는 순간 알약이 튀어나온다.
 */
export function BookEditAction() {
  return (
    <button
      type="button"
      disabled
      className="flex shrink-0 items-center justify-center rounded-full bg-black/10 px-2.5 py-2 text-body-14sb text-text-primary"
    >
      편집
    </button>
  )
}
