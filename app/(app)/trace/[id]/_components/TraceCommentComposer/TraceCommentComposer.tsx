import { useCommentSubmit } from '../../_hooks/useCommentSubmit'
import { CommentBar } from '../CommentBar/CommentBar'

/** 의견에 댓글을 남기는 입력바 — 댓글 시트 하단에 붙는다.
    문구는 CommentBar의 기본값(댓글)을 그대로 쓴다 — 의견에 달리는 것이 곧 댓글이다 */
export function TraceCommentComposer({ opinionId }: { opinionId: number }) {
  const submit = useCommentSubmit(opinionId)

  return <CommentBar onSubmit={submit} />
}
