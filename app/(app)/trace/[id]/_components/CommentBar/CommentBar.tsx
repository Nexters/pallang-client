import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { cn } from '@/app/_global/_services/cn.service'

type CommentBarProps = {
  /**
   * 등록 처리. 실제로 등록됐으면 true를 돌려준다 — 그때만 입력창을 비운다.
   * 미지정이면 등록 없이 입력 UI로만 동작하며, 등록된 적이 없으므로 입력도 그대로 남는다.
   */
  onSubmit?: (content: string) => boolean | Promise<boolean>
  /**
   * floating은 화면 하단에 fixed로 뜨고, sheet는 바텀시트 안에서 흐름에 놓이며,
   * inline은 흔적 목록에서 펼쳐진 댓글 묶음 끝에 카드처럼 놓인다
   */
  variant?: 'floating' | 'sheet' | 'inline'
  placeholder?: string
  /** 제출 버튼의 접근성 이름 — 입력 대상(댓글/답글)과 짝을 맞춘다 */
  submitLabel?: string
}

export function CommentBar({
  onSubmit,
  variant = 'floating',
  placeholder = '댓글을 입력해주세요',
  submitLabel = '댓글 등록',
}: CommentBarProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const isEmpty = content.trim().length === 0

  return (
    <form
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
      /* 색은 어디서나 같다(디자인 202:4910) — 바는 bg-black, 그 위 입력은 한 단 밝은 bg-dark.
         floating: 스크롤 컨테이너 안에서는 sticky가 뷰포트 하단에 붙지 않아 fixed로 띄운다.
         fixed는 셸 패딩을 받지 않으므로 하단 인셋을 직접 소비하고, 셸과 같은 최대 폭으로 가운데 정렬한다.
         sheet: 시트 패널이 pb-0으로 물러나 하단 인셋을 이 바가 대신 소비한다 — 바가 인셋까지
         칠하지 않으면 검은 바 아래로 시트 바닥(bg-dark)이 띠로 드러난다.
         inline: 화면 끝이 아니라 목록 안이라 인셋도 테두리도 없다 — 바로 위 "댓글 더보기"와
         같은 폭·같은 면으로 이어지도록 사방 16px만 둔다 */
      className={cn(
        'bg-bg-black px-4',
        variant === 'inline' && 'py-4',
        variant === 'sheet' && 'shrink-0 border-t border-border-book pt-4 pb-safe',
        variant === 'floating' &&
          'fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-132.5 border-t border-border-book pt-4 pb-safe',
      )}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          maxLength={500}
          onChange={(event) => {
            setContent(event.target.value)
          }}
          placeholder={placeholder}
          className="h-9 min-w-0 flex-1 rounded-full bg-bg-dark px-4 text-body-14rg text-text-inverse outline-none placeholder:text-text-inverse/50"
        />
        {/* 전송 중 표시는 Button의 loading에 맡긴다(스피너 + aria-busy + 클릭 차단).
            비활성 색은 이 바의 기존 처리를 유지한다 — Button 기본값(회색)은 아이콘까지 묻힌다 */}
        <Button
          type="submit"
          variant="activated"
          aria-label={submitLabel}
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
