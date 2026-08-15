/**
 * 목록을 대신하는 자리(로딩·오류·빈 목록)는 모두 같은 상자다 — 높이가 다르면 상태가 넘어갈 때마다
 * 아래 흔적들이 밀려 올라왔다 내려간다. 크기는 빈 목록 카드(디자인 202:5958, 128px)에 맞춘다.
 */
export const COMMENT_PLACEHOLDER_BOX =
  'flex h-32 flex-col items-center justify-center bg-bg-overlay p-4'

/** 실패를 그냥 두면 빈 상자만 남아 "댓글 없음"과 구분되지 않는다 */
export const COMMENT_LIST_ERROR_TEXT = '댓글을 불러오지 못했어요.'
export const COMMENT_LIST_RETRY_TEXT = '댓글 다시 불러오기'

/**
 * 빈 목록을 그냥 두면 의견 카드 바로 아래에 다음 요소가 붙어 "댓글이 없다"는 사실이 화면에 남지 않는다 —
 * 디자인(202:5958)은 같은 자리에 첫 댓글을 권하는 카드를 세워 둔다.
 */
export const COMMENT_EMPTY_TITLE = '아직 남겨진 댓글이 없습니다.'
export const COMMENT_EMPTY_PROMPT = '첫번째 댓글을 달아주세요!'

/** 댓글은 5개까지 보이고 더보기를 누를 때마다 5개씩 이어 붙는다(디자인 2165:5125 주석) */
export const COMMENT_MORE_TEXT = '댓글 더보기'

/** 데이터가 있는 상태의 실패는 목록을 지우지 않고 더보기 자리에서만 알린다 */
export const COMMENT_FETCH_NEXT_ERROR_TEXT = '댓글을 더 불러오지 못했어요. 다시 시도'
export const COMMENT_REFETCH_ERROR_TEXT = '댓글을 갱신하지 못했어요. 다시 시도'

/** 답글 묶음의 더보기 자리 — 첫 페이지가 실패한 동안에는 재시도 문구로 바뀐다 */
export const REPLY_MORE_TEXT = '답글 더보기'
export const REPLY_RETRY_TEXT = '답글 다시 불러오기'
