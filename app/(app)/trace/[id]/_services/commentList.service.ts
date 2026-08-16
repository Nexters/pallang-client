/* 댓글 목록이 "지금 무엇을 보여줄 자리인지" 판정하는 규칙. 쿼리 상태와 화면을 잇는 유일한 지점이라
   컴포넌트 조건문으로 흩어놓지 않고 여기에 모은다. */

/** 목록 자리에 세울 네 갈래 */
export type CommentListView = 'pending' | 'error' | 'empty' | 'list'

export function resolveCommentListView(input: {
  isPending: boolean
  isError: boolean
  count: number
}): CommentListView {
  const { isPending, isError, count } = input

  // 첫 로딩(데이터가 아직 없음)만 자리를 대신한다 — 배경 리페치는 목록을 그대로 두고 aria-busy로만 알린다
  if (isPending) return 'pending'

  // isError는 "데이터 없음"이 아니라 "마지막 요청 실패"라, 이미 받아둔 댓글이 있는데 화면을 통째로
  // 갈아치우면 보이던 댓글이 사라진다 — 보여줄 게 하나도 없을 때만 전체 오류로 간다
  if (isError && count === 0) return 'error'

  if (count === 0) return 'empty'

  return 'list'
}

/** 더보기 자리의 재시도가 무엇을 다시 부를지 */
export type CommentRetryAction = 'fetchNext' | 'refetch'

/** 더보기가 깨졌으면 이어 받을 페이지를, 배경 갱신이 깨졌으면 받아둔 페이지를 다시 부른다 */
export function resolveRetryAction(input: { isFetchNextPageError: boolean }): CommentRetryAction {
  return input.isFetchNextPageError ? 'fetchNext' : 'refetch'
}
