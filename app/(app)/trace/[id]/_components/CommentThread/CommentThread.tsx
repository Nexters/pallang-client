import type { RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { useReplyThread } from '../../_hooks/useReplyThread'
import { CommentItem } from '../CommentItem/CommentItem'

type CommentThreadProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

/**
 * 원댓글 한 개와 그 아래 답글 묶음.
 * 답글은 접힌 채로 시작한다 — 디자인의 댓글 묶음에는 원댓글 카드만 있고,
 * 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나 목록이 화면 세 배 길이가 된다.
 */
export function CommentThread({ comment, myUserId, onUpdate, onRemove }: CommentThreadProps) {
  const { replies, canLoadMore, isFetching, hasError, revealMore } = useReplyThread(comment)

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
    </div>
  )
}
