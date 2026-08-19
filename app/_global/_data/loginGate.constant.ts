/** 게이트 제목은 액션과 무관하게 고정이다 — 액션별 사정은 설명 문구가 말한다 */
export const LOGIN_GATE_TITLE = '로그인하면 확인 할 수 있어요!'

/** 문구를 지정하지 않은 게이트의 범용 기본 문구 — 액션 전용 문구가 없을 때의 안전망 */
export const DEFAULT_LOGIN_GATE_MESSAGE = '팔랑과 함께하고 더 많은 의견을 확인해보세요.'

// ponytail: 액션별 문구는 기획 확정 전 임시안 — 확정되면 교체 (#68)
export const LOGIN_GATE_MESSAGE = {
  like: '로그인하면 이 흔적에 공감할 수 있어요!',
  commentCreate: '로그인하면 댓글을 남길 수 있어요!',
  traceCreate: '로그인하면 흔적을 남길 수 있어요!',
  report: '로그인하면 신고할 수 있어요!',
  block: '로그인하면 차단할 수 있어요!',
  groupCreate: '로그인하면 모임을 만들 수 있어요!',
} as const
