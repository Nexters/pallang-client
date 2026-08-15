import { useState } from 'react'

type AsyncCommentField = {
  content: string
  setContent: (value: string) => void
  /** 공백만 남은 입력도 비어 있는 것으로 본다 — 제출 버튼의 비활성 판정에 쓴다 */
  isEmpty: boolean
  /** 등록 요청이 도는 중 — 제출 버튼의 로딩 표시에 쓴다 */
  isSending: boolean
  submit: () => void
}

/**
 * 비동기 등록에 물린 한 줄 입력의 상태.
 *
 * 등록이 끝나야 비울지가 정해져서 입력값과 전송 상태가 한 몸으로 움직인다 —
 * 재진입 차단, 공백 정리, 성공했을 때만 비우기까지가 이 훅의 몫이다.
 * onSubmit이 없으면 등록 없이 입력 UI로만 동작한다(등록된 적이 없으므로 입력도 그대로 남는다).
 */
export function useAsyncCommentField(
  onSubmit?: (content: string) => boolean | Promise<boolean>,
): AsyncCommentField {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const submit = () => {
    // 응답 전에 한 번 더 누르면 같은 댓글이 두 번 등록된다 — 전송이 도는 동안은 제출을 흘린다
    if (isSending) return
    const trimmed = content.trim()
    if (!trimmed) return
    setIsSending(true)
    // 로그인 게이트가 막았거나 전송이 실패하면 등록이 안 된 것이라 입력을 남긴다 —
    // 지워버리면 로그인 후 처음부터 다시 써야 한다
    void Promise.resolve(onSubmit?.(trimmed)).then((isRegistered) => {
      setIsSending(false)
      if (!isRegistered) return
      // 전송이 도는 동안 이어 쓴 내용은 아직 등록되지 않았다 — 보낸 것과 같을 때만 비운다
      setContent((current) => (current.trim() === trimmed ? '' : current))
    })
  }

  return { content, setContent, isEmpty: content.trim().length === 0, isSending, submit }
}
