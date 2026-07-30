import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { useCommentActions } from '../../_hooks/useCommentActions'
import { CommentBar } from '../CommentBar/CommentBar'

type TraceCommentComposerProps = {
  opinionId: number
}

/** 댓글이 펼쳐진 흔적에 원댓글을 남기는 하단 고정 입력바 */
export function TraceCommentComposer({ opinionId }: TraceCommentComposerProps) {
  const runWithLogin = useLoginGate()
  const actions = useCommentActions(opinionId)

  return (
    <CommentBar
      onSubmit={(content) => {
        runWithLogin(() => {
          actions.create.mutate({ content })
        }, LOGIN_GATE_MESSAGE.commentCreate)
      }}
    />
  )
}
