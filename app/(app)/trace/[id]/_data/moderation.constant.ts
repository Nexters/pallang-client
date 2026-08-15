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

/** 차단 확인 다이얼로그의 고정 문구 — 제목만 닉네임을 앞에 붙여 만든다 */
export const BLOCK_CONFIRM_TEXT = {
  titleSuffix: '님을 차단할까요?',
  description: '차단하면 이 사용자의 흔적과 댓글이 더 이상 보이지 않아요.',
  cancelLabel: '취소',
  confirmLabel: '차단',
} as const

/**
 * 신고 모달의 치수 — Figma 2872:16761.
 * 사유 그리드가 2열인 것은 _data/reportReason.constant.ts의 선택지 순서(좌→우, 위→아래)가 기대는 규격이다.
 */
export const REPORT_DIALOG_LAYOUT = {
  reasonGrid: 'grid-cols-2',
  /** 상세 입력 칸 80px — 공용 Textarea(카운터가 붙은 큰 입력)와 다른 이 모달만의 높이 */
  detailInput: 'h-20',
  actionButton: 'h-[54px]',
  /** 라디오 off 원의 회색 — 시안 radioButton off의 값이라 토큰에 짝이 없다 */
  radioOff: 'bg-[#e5e5e5]',
} as const
