/** 문구를 지정하지 않은 게이트의 기본 문구 — 페이지 탭 열람 차단이 이 문구를 쓴다 */
export const DEFAULT_LOGIN_GATE_MESSAGE = '해당 페이지부터는 로그인해야 확인할 수 있어요!'

// ponytail: 액션별 문구는 기획 확정 전 임시안 — 확정되면 교체 (#68)
export const LOGIN_GATE_MESSAGE = {
  like: '로그인하면 이 흔적에 공감할 수 있어요!',
  commentCreate: '로그인하면 댓글을 남길 수 있어요!',
  traceCreate: '로그인하면 흔적을 남길 수 있어요!',
} as const
