/**
 * 서버 스펙(댓글 content maxLength)과 같은 값 — 새 댓글 입력바와 인라인 수정 입력이 같은 상한을 쓴다.
 * 두 자리에 따로 적어두면 한쪽만 고쳐져 "쓸 때는 되는데 고칠 때는 잘리는" 상태가 된다.
 */
export const COMMENT_MAX_LENGTH = 500

/** 댓글을 남기는 입력바의 문구 — 제출 라벨은 버튼의 접근성 이름이라 입력 대상과 짝을 맞춘다 */
export const COMMENT_INPUT_TEXT = {
  placeholder: '댓글을 입력해주세요',
  submitLabel: '댓글 등록',
} as const

/**
 * 의견에 원댓글을 남기는 입력바의 문구.
 * 화면에서는 의견에 달리는 것이 '답글'로 읽혀(디자인 2224:18752) 댓글이 아니라 답글로 부른다.
 */
export const REPLY_INPUT_TEXT = {
  placeholder: '답글을 입력해주세요',
  submitLabel: '답글 등록',
} as const

/** 인라인 수정 입력의 접근성 이름 — 목록에 여러 개가 떠 있어도 이름으로 집어낼 수 있게 둔다 */
export const COMMENT_EDIT_INPUT_LABEL = '댓글 수정 입력'
