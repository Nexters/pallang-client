import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { commentQueries, type RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { CommentItem } from '../CommentItem/CommentItem'

type CommentThreadProps = {
  comment: RootCommentResponse
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

export function CommentThread({ comment, myUserId, onUpdate, onRemove }: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: repliesData } = useQuery({
    ...commentQueries.replies(comment.commentId),
    enabled: isExpanded,
  })
  // 더보기 전에는 서버가 내려준 미리보기(최대 5개), 펼친 후에는 전체 답글로 교체한다
  const replies = (isExpanded ? repliesData?.data?.comments : undefined) ?? comment.replies

  return (
    <div className="flex flex-col gap-3">
      <CommentItem
        comment={comment}
        isMine={comment.userId === myUserId}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />
      {(replies.length > 0 || comment.hasMoreReplies) && (
        <div className="flex flex-col gap-3 pl-6">
          {replies.map((reply) => (
            <CommentItem
              key={reply.commentId}
              comment={reply}
              isMine={reply.userId === myUserId}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
          {comment.hasMoreReplies && !isExpanded && (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true)
              }}
              className="self-start text-body-14rg text-text-inverse opacity-50"
            >
              답글 더보기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
