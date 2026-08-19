import { useCommentSubmit } from '../../_hooks/useCommentSubmit'
import { CommentBar } from '../CommentBar/CommentBar'

type TraceCommentComposerProps = {
  opinionId: number
  /** sheet는 답글 화면 안 흐름에 놓이고, floating은 흔적 페이지 하단에 고정으로 뜬다 */
  variant?: 'sheet' | 'floating'
}

/** 의견에 원댓글을 남기는 입력바 — 답글 화면 하단과 흔적 목록의 펼침 자리에서 함께 쓴다 */
export function TraceCommentComposer({
  opinionId,
  variant = 'floating',
}: TraceCommentComposerProps) {
  const submit = useCommentSubmit(opinionId)

  return (
    // 화면에서는 의견에 달리는 것이 '답글'로 읽혀 댓글이 아니라 답글로 부른다
    <CommentBar
      variant={variant}
      placeholder="답글을 입력해주세요"
      submitLabel="답글 등록"
      onSubmit={submit}
    />
  )
}
