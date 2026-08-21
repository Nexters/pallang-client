import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { resolveCommentListView, resolveRetryAction } from '../_services/commentList.service'
import { useCommentActions } from './useCommentActions'

/** 댓글 읽기 흐름 — 목록 조회·내 식별·수정/삭제를 한 뷰모델로 묶는다 */
export function useTraceComments(opinionId: number, options?: { enabled?: boolean }) {
  // 시트 셸(TraceCommentSheet)이 이 훅을 소유하면서 아직 아무 의견도 보여준 적 없는
  // 첫 렌더가 생겼다 — 그때는 조회를 걸지 않는다(#373)
  const commentsQuery = useInfiniteQuery({
    ...commentQueries.listByOpinion(opinionId),
    enabled: options?.enabled ?? true,
  })
  // 비로그인이면 me 조회가 실패해 myUserId가 없고, 수정·삭제 버튼이 숨겨진다
  const { data: meData } = useQuery(userQueries.me())
  const actions = useCommentActions(opinionId)

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data?.comments ?? []) ?? [],
    [commentsQuery.data],
  )

  const view = resolveCommentListView({
    isPending: commentsQuery.isPending,
    isError: commentsQuery.isError,
    count: comments.length,
  })
  // 보여줄 댓글이 하나도 없는 전체 오류 자리에서는 이어 받을 페이지 자체가 없다 — 언제나 처음부터 다시 받는다
  const retryAction =
    view === 'list'
      ? resolveRetryAction({ isFetchNextPageError: commentsQuery.isFetchNextPageError })
      : 'refetch'

  return {
    comments,
    myUserId: meData?.data?.userId,
    view,
    isFetching: commentsQuery.isFetching,
    /** 목록을 지우지 않고 더보기 자리에서만 알리는 실패 */
    hasInlineError: commentsQuery.isError,
    retryAction,
    retry: () => {
      if (retryAction === 'fetchNext') void commentsQuery.fetchNextPage()
      else void commentsQuery.refetch()
    },
    canLoadMore: commentsQuery.hasNextPage,
    isLoadingMore: commentsQuery.isFetchingNextPage,
    loadMore: () => {
      void commentsQuery.fetchNextPage()
    },
    update: (commentId: number, content: string) => {
      actions.update.mutate({ commentId, content })
    },
    remove: (commentId: number) => {
      actions.remove.mutate(commentId)
    },
  }
}
