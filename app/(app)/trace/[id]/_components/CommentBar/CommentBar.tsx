import { Button } from '@/app/_global/_components/Button/Button'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { COMMENT_INPUT_TEXT, COMMENT_MAX_LENGTH } from '../../_data/commentInput.constant'
import { useAsyncCommentField } from '../../_hooks/useAsyncCommentField'

type CommentBarProps = {
  /**
   * 등록 처리. 실제로 등록됐으면 true를 돌려준다 — 그때만 입력창을 비운다.
   * 미지정이면 등록 없이 입력 UI로만 동작하며, 등록된 적이 없으므로 입력도 그대로 남는다.
   */
  onSubmit?: (content: string) => boolean | Promise<boolean>
  /** floating은 화면 하단에 fixed로 뜨고, sheet는 바텀시트 안에서 흐름에 놓인다 */
  variant?: 'floating' | 'sheet'
  placeholder?: string
  /** 제출 버튼의 접근성 이름 — 입력 대상(댓글/답글)과 짝을 맞춘다 */
  submitLabel?: string
}

export function CommentBar({
  onSubmit,
  variant = 'floating',
  placeholder = COMMENT_INPUT_TEXT.placeholder,
  submitLabel = COMMENT_INPUT_TEXT.submitLabel,
}: CommentBarProps) {
  const field = useAsyncCommentField(onSubmit)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        field.submit()
      }}
      /* 색은 두 자리에서 같다(디자인 202:4910) — 바는 bg-black, 그 위 입력은 한 단 밝은 bg-dark.
         floating: 스크롤 컨테이너 안에서는 sticky가 뷰포트 하단에 붙지 않아 fixed로 띄운다.
         fixed는 셸 패딩을 받지 않으므로 하단 인셋을 직접 소비하고, 셸과 같은 최대 폭으로 가운데 정렬한다.
         sheet: 시트 패널이 pb-0으로 물러나 하단 인셋을 이 바가 대신 소비한다 — 바가 인셋까지
         칠하지 않으면 검은 바 아래로 시트 바닥(bg-dark)이 띠로 드러난다 */
      className={cn(
        'border-t border-border-book bg-bg-black px-4 pt-4 pb-safe',
        variant === 'sheet'
          ? 'shrink-0'
          : 'fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-132.5',
      )}
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={field.content}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => {
            field.setContent(event.target.value)
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
          loading={field.isSending}
          disabled={field.isEmpty}
          className="size-9.5 shrink-0 rounded-full p-0 disabled:bg-interactive-accent disabled:opacity-40"
        >
          <PencilIcon width={20} height={20} className="text-icon-active" />
        </Button>
      </div>
    </form>
  )
}
