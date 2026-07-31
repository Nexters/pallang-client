import { useState } from 'react'

import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type CommentBarProps = {
  /**
   * 등록 처리. 실제로 등록됐으면 true를 돌려준다 — 그때만 입력창을 비운다.
   * 미지정이면 등록 없이 입력 UI로만 동작하며, 등록된 적이 없으므로 입력도 그대로 남는다.
   */
  onSubmit?: (content: string) => boolean | Promise<boolean>
  /** 상세 오버레이(aria-modal) 뒤에 깔린 동안 포커스·접근성 트리에서 빠진다 */
  isInert?: boolean
}

export function CommentBar({ onSubmit, isInert }: CommentBarProps) {
  const [content, setContent] = useState('')
  const isEmpty = content.trim().length === 0

  return (
    <form
      inert={isInert}
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = content.trim()
        if (!trimmed) return
        // 로그인 게이트가 막았거나 전송이 실패하면 등록이 안 된 것이라 입력을 남긴다 —
        // 지워버리면 로그인 후 처음부터 다시 써야 한다
        void Promise.resolve(onSubmit?.(trimmed)).then((isRegistered) => {
          if (isRegistered) setContent('')
        })
      }}
      /* 스크롤 컨테이너 안에서는 sticky가 뷰포트 하단에 붙지 않아 fixed로 띄운다.
         fixed는 셸 패딩을 받지 않으므로 하단 인셋을 직접 소비하고, 셸과 같은 최대 폭으로 가운데 정렬한다.
         가려지는 만큼의 여백은 목록 쪽에서 스페이서로 확보한다(TraceCollapseView.module.css) */
      style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-132.5 border-t border-border-book bg-bg-black px-4 pt-4"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          maxLength={500}
          onChange={(event) => {
            setContent(event.target.value)
          }}
          placeholder="댓글을 입력해주세요"
          className="h-9 min-w-0 flex-1 rounded-full bg-bg-dark px-4 text-body-14rg text-text-inverse outline-none placeholder:text-text-inverse/50"
        />
        <button
          type="submit"
          aria-label="댓글 등록"
          disabled={isEmpty}
          className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-interactive-accent disabled:opacity-40"
        >
          <PencilIcon width={20} height={20} className="text-icon-active" />
        </button>
      </div>
    </form>
  )
}
