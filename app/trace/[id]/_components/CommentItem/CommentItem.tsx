import { useState } from 'react'

import type { CommentResponse } from '@/app/_global/_queries/comment.queries'

import { formatTraceDate } from '../../_services/traceFormat.service'

type CommentItemProps = {
  comment: CommentResponse
  isMine: boolean
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
}

export function CommentItem({ comment, isMine, onUpdate, onRemove }: CommentItemProps) {
  // null이면 보기 모드, 문자열이면 그 값을 편집 중
  const [draft, setDraft] = useState<string | null>(null)

  if (comment.isDeleted) {
    return <p className="text-body-14rg text-text-inverse opacity-50">삭제된 댓글입니다</p>
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-body-14rg">
        <span className="text-body-14sb text-text-inverse">{comment.nickname}</span>
        <span className="text-text-inverse opacity-50">{formatTraceDate(comment.createdAt)}</span>
        {isMine && draft === null && (
          <span className="ml-auto flex gap-2 text-text-inverse opacity-50">
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
          </span>
        )}
      </div>
      {draft === null ? (
        <p className="text-body-14rg text-text-inverse">{comment.content}</p>
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
    </div>
  )
}
