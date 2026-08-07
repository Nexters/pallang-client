import { useState } from 'react'

import ReplyIcon from '@/app/_global/_components/Icon/assets/reply.svg'
import type { CommentResponse } from '@/app/_global/_queries/comment.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { formatTraceDate } from '../../_services/traceFormat.service'
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
  // null이면 보기 모드, 문자열이면 그 값을 편집 중
  const [draft, setDraft] = useState<string | null>(null)

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
          {draft === null ? (
            <p className="break-words text-body-16md text-text-inverse">{comment.content}</p>
          ) : (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                const trimmed = draft.trim()
                if (trimmed && trimmed !== comment.content) onUpdate(comment.commentId, trimmed)
                setDraft(null)
              }}
            >
              <input
                type="text"
                aria-label="댓글 수정 입력"
                value={draft}
                maxLength={500}
                onChange={(event) => {
                  setDraft(event.target.value)
                }}
                className="min-w-0 flex-1 rounded-full bg-bg-dark px-4 py-1.5 text-body-14rg text-text-inverse outline-none"
              />
              <button type="submit" className="shrink-0 text-body-14rg text-text-inverse">
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(null)
                }}
                className="shrink-0 text-body-14rg text-text-inverse opacity-50"
              >
                취소
              </button>
            </form>
          )}
          <div className="flex items-center gap-3 text-body-14rg text-text-inverse/50">
            <span>{formatTraceDate(comment.createdAt)}</span>
            {isMine && draft === null && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.content)
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
