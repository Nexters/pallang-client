'use client'

import { useCommentSubmit } from '../../_hooks/useCommentSubmit'
import { CommentBar } from '../CommentBar/CommentBar'

type TraceReplyComposerProps = {
  opinionId: number
  parentCommentId: number
}

/** 댓글에 답글을 남기는 입력바 — 답글 시트 하단에 붙는다(시안 3393-49475).
    등록은 댓글과 같은 경로(useCommentSubmit)에 parentCommentId만 실린다 */
export function TraceReplyComposer({ opinionId, parentCommentId }: TraceReplyComposerProps) {
  const submit = useCommentSubmit(opinionId, parentCommentId)

  return <CommentBar placeholder="답글을 입력해주세요" submitLabel="답글 등록" onSubmit={submit} />
}
