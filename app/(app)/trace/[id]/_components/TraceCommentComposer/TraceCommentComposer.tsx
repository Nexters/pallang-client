import { useCommentSubmit } from '../../_hooks/useCommentSubmit'
import { CommentBar } from '../CommentBar/CommentBar'

/** 의견에 원댓글을 남기는 입력바 — 답글 시트 하단에 붙는다 */
export function TraceCommentComposer({ opinionId }: { opinionId: number }) {
  const submit = useCommentSubmit(opinionId)

  return (
    // 화면에서는 의견에 달리는 것이 '답글'로 읽혀 댓글이 아니라 답글로 부른다
    <CommentBar placeholder="답글을 입력해주세요" submitLabel="답글 등록" onSubmit={submit} />
  )
}
