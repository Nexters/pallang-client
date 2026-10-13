import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { useCommentActions } from './useCommentActions'

/**
 * 의견에 댓글을 등록한다 — parentCommentId를 주면 그 댓글의 답글(1-depth)로 달린다(#367).
 * 로그인 게이트 → 등록 → 목록 갱신까지 모두 끝났을 때만 true를 돌려준다.
 *
 * 입력바는 이 값 하나로 입력을 비울지 남길지 정한다. 게이트가 막았거나 전송이 실패하면 등록이 안 된
 * 것이라 false다 — 비워버리면 로그인한 뒤 처음부터 다시 써야 한다.
 * 게이트·뮤테이션 모두 콜백으로 끝을 알려주므로 그 둘을 하나의 promise로 모아 돌려준다.
 */
export function useCommentSubmit(opinionId: number, parentCommentId?: number) {
  const runWithLogin = useLoginGate()
  const actions = useCommentActions(opinionId)

  return (content: string) =>
    new Promise<boolean>((resolve) => {
      const isStarted = runWithLogin(() => {
        actions.create.mutate(
          // 원댓글이면 자리째 뺀다 — 서버가 이 자리의 유무로 원댓글/답글을 가른다
          { content, ...(parentCommentId === undefined ? {} : { parentCommentId }) },
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
