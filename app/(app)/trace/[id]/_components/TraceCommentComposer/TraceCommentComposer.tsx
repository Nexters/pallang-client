import { REPLY_INPUT_TEXT } from '../../_data/commentInput.constant'
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
    <CommentBar
      variant={variant}
      placeholder={REPLY_INPUT_TEXT.placeholder}
      submitLabel={REPLY_INPUT_TEXT.submitLabel}
      onSubmit={submit}
    />
  )
}
