'use client'

import type { RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { useReplyThread } from '../../_hooks/useReplyThread'
import { CommentItem } from '../CommentItem/CommentItem'

type ReplyThreadSectionProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

/** 답글 시트 본문 — 원댓글 한 장과 그 아래 `└` 답글 목록.
    미리보기(원댓글 응답의 최대 5개)는 펼쳐진 채 시작하고, 남은 답글은 더보기로 이어 받는다 */
export function ReplyThreadSection({
  comment,
  myUserId,
  onUpdate,
  onRemove,
}: ReplyThreadSectionProps) {
  const { replies, canLoadMore, isFetching, hasError, revealMore } = useReplyThread(comment)

  return (
    <section aria-label="답글 목록" className="flex flex-col gap-0.5 pb-4">
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
      {canLoadMore && (
        <button
          type="button"
          disabled={isFetching}
          onClick={revealMore}
          className="bg-bg-overlay py-3 pl-8 text-left text-body-14rg text-text-inverse/50"
        >
          {hasError ? '답글 다시 불러오기' : '답글 더보기'}
        </button>
      )}
    </section>
  )
}
