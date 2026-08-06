import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
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
  const [isSending, setIsSending] = useState(false)
  const isEmpty = content.trim().length === 0

  return (
    <form
      inert={isInert}
      onSubmit={(event) => {
        event.preventDefault()
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
      }}
      /* 스크롤 컨테이너 안에서는 sticky가 뷰포트 하단에 붙지 않아 fixed로 띄운다.
         fixed는 셸 패딩을 받지 않으므로 하단 인셋을 직접 소비하고, 셸과 같은 최대 폭으로 가운데 정렬한다.
         가려지는 만큼의 여백은 목록 쪽에서 스페이서로 확보한다(TraceCollapseView.module.css) */
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-132.5 border-t border-border-book bg-bg-black px-4 pt-4 pb-safe"
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
        {/* 전송 중 표시는 Button의 loading에 맡긴다(스피너 + aria-busy + 클릭 차단).
            비활성 색은 이 바의 기존 처리를 유지한다 — Button 기본값(회색)은 아이콘까지 묻힌다 */}
        <Button
          type="submit"
          variant="activated"
          aria-label="댓글 등록"
          loading={isSending}
          disabled={isEmpty}
          className="size-9.5 shrink-0 rounded-full p-0 disabled:bg-interactive-accent disabled:opacity-40"
        >
          <PencilIcon width={20} height={20} className="text-icon-active" />
        </Button>
      </div>
    </form>
  )
}
