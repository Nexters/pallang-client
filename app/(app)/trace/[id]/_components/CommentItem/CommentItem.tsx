import { useState } from 'react'

import ReplyIcon from '@/app/_global/_components/Icon/assets/reply.svg'
import type { CommentResponse } from '@/app/_global/_queries/comment.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { resolveCommentEdit } from '../../_services/commentEdit.service'
import { formatTraceDate } from '../../_services/traceFormat.service'
import { CommentEditForm } from '../CommentEditForm/CommentEditForm'
import { ModerationMenu } from '../ModerationMenu/ModerationMenu'

type CommentItemProps = {
  comment: CommentResponse
  isMine: boolean
  /** 답글은 원댓글 아래로 한 단 들여쓴다 — 디자인에는 원댓글 카드만 있어 들여쓰기만 더한다 */
  isReply?: boolean
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

export function CommentItem({ comment, isMine, isReply, onUpdate, onRemove }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className={cn('flex items-start gap-0.5 bg-bg-overlay p-4', isReply && 'pl-8')}>
      <ReplyIcon width={16} height={16} className="shrink-0 text-text-inverse/50" />
      {comment.isDeleted ? (
        <p className="text-body-16md text-text-inverse/50">삭제된 댓글입니다</p>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-body-14sb text-text-inverse/50">{comment.nickname}</span>
            {/* 내 댓글에는 ⋯ 대신 아래의 수정/삭제가 붙는다 — 남의 댓글에만 신고·차단 메뉴를 연다 */}
            {!isMine && (
              <ModerationMenu
                target={{ type: 'comment', id: comment.commentId }}
                authorUserId={comment.userId}
                authorNickname={comment.nickname}
              />
            )}
          </div>
          {isEditing ? (
            <CommentEditForm
              initialContent={comment.content}
              onSubmit={(draft) => {
                // 공백만 남겼거나 원문 그대로면 보낼 것이 없다 — 요청 없이 보기 모드로 돌아간다
                const content = resolveCommentEdit(draft, comment.content)
                if (content !== null) onUpdate(comment.commentId, content)
                setIsEditing(false)
              }}
              onCancel={() => {
                setIsEditing(false)
              }}
            />
          ) : (
            <p className="break-words text-body-16md text-text-inverse">{comment.content}</p>
          )}
          <div className="flex items-center gap-3 text-body-14rg text-text-inverse/50">
            <span>{formatTraceDate(comment.createdAt)}</span>
            {isMine && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true)
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(comment.commentId)
                  }}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
