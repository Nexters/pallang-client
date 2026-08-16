/** 신고·차단의 결과 안내 문구 — 모두 스낵바로 나간다 */
export const MODERATION_MESSAGE = {
  reportSuccess: '신고가 접수됐어요.',
  /** 4xx — 본인 글이거나 이미 신고한 글. 다시 시도해도 결과가 같다 */
  reportRejected: '이미 신고했거나 신고할 수 없는 글이에요.',
  reportFailure: '신고하지 못했어요. 잠시 후 다시 시도해주세요.',
  blockSuccess: '차단했어요.',
  blockFailure: '차단하지 못했어요. 잠시 후 다시 시도해주세요.',
} as const

/** 클라이언트 오류(4xx)로 볼 상태 코드 구간 — min 이상 maxExclusive 미만 */
export const CLIENT_ERROR_STATUS = {
  min: 400,
  maxExclusive: 500,
} as const
