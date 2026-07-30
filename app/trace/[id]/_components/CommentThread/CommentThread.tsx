import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { commentQueries, type RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { CommentItem } from '../CommentItem/CommentItem'

type CommentThreadProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

/**
 * 원댓글 한 개와 그 아래 답글 묶음.
 * 답글은 접힌 채로 시작한다 — 디자인(2224:18752 / 2165:5144)의 댓글 묶음에는 원댓글 카드만 있고,
 * 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나 목록이 화면 세 배 길이가 된다.
 */
export function CommentThread({ comment, myUserId, onUpdate, onRemove }: CommentThreadProps) {
  // 0: 접힘, 1: 원댓글 응답이 준 미리보기(최대 5개)까지, 2+: 미리보기 + 더보기로 받은 페이지
  const [revealStep, setRevealStep] = useState(0)
  const repliesQuery = useInfiniteQuery({
    ...commentQueries.replies(comment.commentId),
    enabled: revealStep >= 2,
  })
  const replies = useMemo(
    () =>
      revealStep === 0
        ? []
        : [
            ...comment.replies,
            ...(repliesQuery.data?.pages.flatMap((page) => page.data?.comments ?? []) ?? []),
          ],
    [comment.replies, repliesQuery.data, revealStep],
  )
  const canLoadMoreReplies =
    revealStep === 0
      ? comment.replyCount > 0
      : revealStep === 1
        ? comment.hasMoreReplies
        : repliesQuery.hasNextPage

  return (
    <div className="flex flex-col gap-0.5">
      <CommentItem
        comment={comment}
        isMine={comment.userId === myUserId}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
      {replies.map((reply) => (
        <CommentItem
          key={reply.commentId}
          comment={reply}
          isMine={reply.userId === myUserId}
          isReply
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
      {canLoadMoreReplies && (
        <button
          type="button"
          disabled={repliesQuery.isFetchingNextPage}
          onClick={() => {
            if (revealStep < 2) {
              setRevealStep(revealStep + 1)
              return
            }
            void repliesQuery.fetchNextPage()
          }}
          className="bg-bg-overlay py-3 pl-8 text-left text-body-14rg text-text-inverse/50"
        >
          답글 더보기
        </button>
      )}
    </div>
  )
}
