import type { RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { CommentItem } from '../CommentItem/CommentItem'

type CommentThreadProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
  /** 답글 줄을 누르면 답글 시트가 열린다(#367) — 읽기도 쓰기도 그 시트가 맡는다 */
  onOpenReplies: (commentId: number) => void
}

/**
 * 원댓글 한 개와 답글로 들어가는 줄.
 * 답글을 인라인으로 펼치는 대신 답글 시트(TraceReplySheet)로 보낸다 — 디자인의 댓글 묶음에는
 * 원댓글 카드만 있고, 미리보기까지 펼쳐두면 "댓글 5개"가 카드 13개로 불어나 목록이 세 배 길어진다.
 */
export function CommentThread({
  comment,
  myUserId,
  onUpdate,
  onRemove,
  onOpenReplies,
}: CommentThreadProps) {
  // 삭제된 댓글에는 새 답글을 권하지 않는다 — 이미 달린 답글이 있을 때만 들어가는 길을 남긴다
  const canOpenReplies = !comment.isDeleted || comment.replyCount > 0

  return (
    <div className="flex flex-col gap-0.5">
      <CommentItem
        comment={comment}
        isMine={comment.userId === myUserId}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
      {canOpenReplies && (
        <button
          type="button"
          onClick={() => {
            onOpenReplies(comment.commentId)
          }}
          className="bg-bg-overlay py-3 pl-8 text-left text-body-14rg text-text-inverse/50"
        >
          {comment.replyCount > 0 ? `답글 ${String(comment.replyCount)}개 보기` : '답글 달기'}
        </button>
      )}
    </div>
  )
}
