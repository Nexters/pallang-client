/* 무대(주황 밴드 · 포스트잇 카드 · 대목 페이저)의 기준 좌표계.

   시안(Figma 229:24122)은 375×812 프레임에 상태바 44px를 포함해 그려져 있다.
   앱에서는 그 44px 자리를 노치 인셋(--safe-top)이 대신하므로, 여기 수치는 모두
   시안 y좌표에서 44를 뺀 값이다 — 읽는 쪽에서 `calc(var(--safe-top) + …)`로 얹는다.

   무대는 더 이상 스크롤에 반응하지 않는다(#접힘 제거). 좌표가 진행률로 흔들리지 않으니
   CSS 커스텀 프로퍼티를 거칠 이유도 없어, 값을 쓰는 곳에서 직접 읽는다. */

/** 좌표 상수를 CSS 길이로. 읽는 쪽(QuoteStage·TracePageSkeleton·TraceReplySheet)이 각자
    문자열을 만들면 단위를 빠뜨려도 타입으로는 걸리지 않는다 */
export function px(value: number): string {
  return `${String(value)}px`
}

/** TraceHeader: py-2.5(20) + 아이콘 24 */
export const HEADER_HEIGHT = 44
/** 주황 밴드가 덮는 높이 — 이 아래로는 흰 면이다(시안 300) */
export const BAND_HEIGHT = 256
/** 포스트잇 카드 (시안 106) */
export const CARD_TOP = 62
export const CARD_WIDTH = 300
export const CARD_HEIGHT = 310
/** 대목 페이저 — 카드 아래 20px에 놓인다(시안 436). 폭은 카드보다 살짝 넓어 화살표가 바깥으로 벌어진다 */
export const PAGER_TOP = 392
export const PAGER_WIDTH = 303
/** 무대 전체 높이 = 어두운 시트가 기본 높이일 때 시작하는 자리(시안 488) */
export const STAGE_HEIGHT = 444

/* 어두운 패널은 그 자체가 높이 조절되는 바텀시트다. 두 자리 사이를 오간다. */

/** 기본(최소) 높이일 때 시트 윗면 — 무대 바로 아래 */
export const SHEET_TOP_DEFAULT = STAGE_HEIGHT
/** 끝까지 올렸을 때 시트 윗면(시안 229:24095의 y=106).
    카드 윗면과 같은 자리라 시트가 무대를 정확히 덮고 헤더만 남는다 */
export const SHEET_TOP_EXPANDED = CARD_TOP
