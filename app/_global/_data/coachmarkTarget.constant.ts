/**
 * 코치마크가 비출 대상을 표시하는 DOM 마커(`data-coachmark`) 값.
 *
 * 스포트라이트는 대상의 rect를 재서 딤에 구멍을 뚫으므로 실제 엘리먼트를 찾아야 하는데,
 * 대상이 _global 탭바와 홈 화면에 흩어져 있다. ref를 탭바 props로 내려보내면 공용 컴포넌트에
 * 홈 전용 관심사가 섞이므로, 마커 하나만 붙여 두고 오버레이가 DOM에서 찾는다.
 *
 * 값을 바꾸면 오버레이는 대상을 못 찾고 조용히 그 단계를 건너뛴다 — 여기와 사용처를 함께 고친다.
 */
export const COACHMARK_TARGET = {
  /** 하단 탭바의 "탐색" 탭 */
  bookExplore: 'book-explore',
  /** 홈 내 서재에서 가운데(활성) 책 카드 + 그 아래 제목·저자 행. 둘의 합집합이 구멍이 된다. */
  homeActiveBook: 'home-active-book',
  /** 홈 내 서재 영역 전체. 책이 없어 비출 카드가 없을 때 쓰는 대체 대상이다. */
  homeLibrary: 'home-library',
  /** 하단 탭바 가운데 "+"(흔적 남기기) 버튼 */
  traceCreate: 'trace-create',
} as const

export type CoachmarkTargetName = (typeof COACHMARK_TARGET)[keyof typeof COACHMARK_TARGET]

export function getCoachmarkTargetSelector(target: CoachmarkTargetName): string {
  return `[data-coachmark="${target}"]`
}
