import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { commentQueries, type RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import {
  canRevealMoreReplies,
  hasReplyRevealError,
  resolveReplyRevealAction,
  resolveVisibleReplies,
} from '../_services/replyReveal.service'

/** 원댓글 하나의 답글 펼치기 흐름 — 펼침 단계와 답글 페이지 조회를 소유한다 */
export function useReplyThread(comment: RootCommentResponse) {
  // 0: 접힘, 1: 원댓글 응답이 준 미리보기(최대 5개)까지, 2+: 미리보기 + 더보기로 받은 페이지
  const [revealStep, setRevealStep] = useState(0)
  const repliesQuery = useInfiniteQuery({
    ...commentQueries.replies(comment.commentId),
    enabled: revealStep >= 2,
  })
  const fetchedReplies = useMemo(
    () => repliesQuery.data?.pages.flatMap((page) => page.data?.comments ?? []) ?? [],
    [repliesQuery.data],
  )

  const hasError = hasReplyRevealError({ revealStep, isError: repliesQuery.isError })

  return {
    replies: resolveVisibleReplies({
      revealStep,
      previewReplies: comment.replies,
      fetchedReplies,
    }),
    canLoadMore: canRevealMoreReplies({
      revealStep,
      replyCount: comment.replyCount,
      hasMoreReplies: comment.hasMoreReplies,
      hasNextPage: repliesQuery.hasNextPage,
      isPending: repliesQuery.isPending,
      hasError,
    }),
    isFetching: repliesQuery.isFetching,
    hasError,
    revealMore: () => {
      const action = resolveReplyRevealAction({ revealStep, hasError })
      if (action === 'expand') {
        setRevealStep(revealStep + 1)
        return
      }
      if (action === 'refetch') {
        void repliesQuery.refetch()
        return
      }
      void repliesQuery.fetchNextPage()
    },
  }
}
