/* 인용문 무대의 클래스 상수.
   두 곳 이상이 똑같이 써야 어긋나지 않는 겉모습과, 시안에서 그대로 받아 적은 임의값만 모은다.
   전환에 쓰이는 좌표 수치는 여기가 아니라 _services/quoteCollapse.service에 있다. */

/** 트리거와 열린 목록이 하나의 알약으로 이어져 보여야 해서 유리 질감은 두 곳이 똑같이 쓴다 */
export const GLASS_SURFACE = 'bg-black/10 backdrop-blur-[9px]'

/** 항목을 가르는 점선 — SVG 대신 CSS 테두리라 목록 너비가 바뀌어도 따라 늘어난다 */
export const DASHED_RULE = 'border-t border-dashed border-black/10'

/** 열린 쪽 목록의 최대 높이 — 넘치면 목록 안에서 스크롤하며 이어 불러온다 */
export const PAGE_LIST_MAX_HEIGHT = 'max-h-60'

/** 모눈종이 배경 이미지의 고정 크기(시안 200:939) — 화면 폭과 무관한 정적 그림이다 */
export const GRID_PAPER_SIZE = 'h-[820px] w-[530px]'

/** 스포일러 가림막의 흐림 — 쪽 선택기 유리와 같은 세기를 쓴다 */
export const SPOILER_COVER_BLUR = 'backdrop-blur-[9px]'

/** ponytail: #3e3e3e는 디자인 변수 미연결 색 — 토큰 추가 시 치환 */
export const SPOILER_ICON_COLOR = 'text-[#3e3e3e]'

/** 흔적 목록 정렬 바 높이 — 로딩 골격이 같은 높이로 자리를 잡아야 도착했을 때 튀지 않는다 */
export const SORT_BAR_HEIGHT = 'h-15'
