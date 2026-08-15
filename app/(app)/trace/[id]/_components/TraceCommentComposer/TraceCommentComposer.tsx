import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { useCommentActions } from '../../_hooks/useCommentActions'
import { CommentBar } from '../CommentBar/CommentBar'

type TraceCommentComposerProps = {
  opinionId: number
  /** sheet는 답글 화면 하단에 붙고, inline은 흔적 아래 펼쳐진 댓글 묶음 끝에 놓인다 */
  variant?: 'sheet' | 'inline'
}

/** 의견에 원댓글을 남기는 입력바 — 답글 화면 하단과 흔적 목록의 펼침 자리에서 함께 쓴다 */
export function TraceCommentComposer({ opinionId, variant = 'sheet' }: TraceCommentComposerProps) {
  const runWithLogin = useLoginGate()
  const actions = useCommentActions(opinionId)

  return (
    <CommentBar
      variant={variant}
      placeholder="답글을 입력해주세요"
      submitLabel="답글 등록"
      onSubmit={(content) =>
        new Promise<boolean>((resolve) => {
          const isStarted = runWithLogin(() => {
            actions.create.mutate(
              { content },
              {
                // 목록 갱신까지 끝난 뒤에 true다 — 새 답글이 보이고 나서 입력창이 비워진다
                onSuccess: () => {
                  resolve(true)
                },
                onError: () => {
                  resolve(false)
                },
              },
            )
          }, LOGIN_GATE_MESSAGE.commentCreate)
          // 게이트가 막으면 등록이 시작되지도 않는다 — 입력한 내용을 그대로 남긴다
          if (!isStarted) resolve(false)
        })
      }
    />
  )
}
