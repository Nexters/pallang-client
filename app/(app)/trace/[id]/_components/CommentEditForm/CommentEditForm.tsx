import { useState } from 'react'

import { COMMENT_MAX_LENGTH } from '../../_data/commentInput.constant'

type CommentEditFormProps = {
  /** 폼이 뜰 때의 원문 — 마운트 시점의 값으로 시작하고, 그 뒤 편집 중에는 이 폼이 값을 쥔다 */
  initialContent: string
  /** 확정. 보낼지 말지(공백·무변경)는 호출부가 원문과 비교해 정한다 */
  onSubmit: (draft: string) => void
  onCancel: () => void
}

/** 댓글 한 줄을 그 자리에서 고치는 인라인 폼 — 편집 중인 값은 여기서만 산다 */
export function CommentEditForm({ initialContent, onSubmit, onCancel }: CommentEditFormProps) {
  const [draft, setDraft] = useState(initialContent)

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(draft)
      }}
    >
      {/* aria-label은 목록에 수정 폼이 여러 개 떠 있어도 이름으로 집어낼 수 있게 둔다 */}
      <input
        type="text"
        aria-label="댓글 수정 입력"
        value={draft}
        maxLength={COMMENT_MAX_LENGTH}
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
        onClick={onCancel}
        className="shrink-0 text-body-14rg text-text-inverse opacity-50"
      >
        취소
      </button>
    </form>
  )
}
