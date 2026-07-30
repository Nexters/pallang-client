import { useState } from 'react'

import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type CommentBarProps = {
  /** 미지정이면 등록 없이 입력 UI로만 동작한다 */
  onSubmit?: (content: string) => void
}

export function CommentBar({ onSubmit }: CommentBarProps) {
  const [content, setContent] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = content.trim()
        if (!trimmed) return
        onSubmit?.(trimmed)
        setContent('')
      }}
      className="sticky bottom-0 flex items-center gap-2 border-t border-border-book bg-bg-black p-4"
    >
      <input
        type="text"
        value={content}
        maxLength={500}
        onChange={(event) => {
          setContent(event.target.value)
        }}
        placeholder="댓글을 입력해주세요"
        className="min-w-0 flex-1 rounded-full bg-bg-dark px-4 h-9 text-body-14rg text-text-inverse outline-none placeholder:text-text-inverse/50"
      />
      <button
        type="submit"
        aria-label="댓글 등록"
        className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-interactive-accent"
      >
        <PencilIcon width={20} height={20} className="text-icon-active" />
      </button>
    </form>
  )
}
