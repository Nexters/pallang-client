'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import ResetIcon from '@/app/_global/_components/Icon/assets/reset.svg'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { MAX_QUOTE_LENGTH } from '../../_data/quote.constant'

type OcrQuoteSheetProps = {
  /** 지울 것이 남아 있는지. 사진에 고른 표시만 남고 글이 빈 경우도 포함한다. */
  canClear: boolean
  /** 골랐지만 길이 상한을 넘겨 담기지 않은 어절이 있는지 */
  hasOverflow: boolean
  onChange: (quotedText: string) => void
  onClearAll: () => void
  onClose: () => void
  onRetake: () => void
  onSubmit: () => void
  quotedText: string
}

export function OcrQuoteSheet({
  canClear,
  hasOverflow,
  onChange,
  onClearAll,
  onClose,
  onRetake,
  onSubmit,
  quotedText,
}: OcrQuoteSheetProps) {
  return (
    <section
      aria-label="발췌한 텍스트"
      className="flex shrink-0 flex-col rounded-t-[32px] bg-bg-default"
    >
      <div className="flex flex-col gap-4 pt-6">
        <TopBar.Root>
          <TopBar.Title as="h1">발췌된 문장은 직접 수정할 수 있어요</TopBar.Title>
          <TopBar.Spacer />
          <TopBar.Action aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </TopBar.Action>
        </TopBar.Root>

        <div className="flex items-center justify-between gap-2 px-4">
          <p
            aria-live="polite"
            className={
              hasOverflow ? 'text-body-14md text-text-accent' : 'text-body-14md text-text-tertiary'
            }
          >
            {quotedText.length}/{MAX_QUOTE_LENGTH}
            {hasOverflow && ' · 뒷부분은 담기지 않았어요'}
          </p>
          {/* 잘못 골랐을 때 고른 자리를 되짚어 지우지 않아도 되는 탈출구 */}
          <button
            type="button"
            onClick={onClearAll}
            disabled={!canClear}
            className="press shrink-0 cursor-pointer text-body-14md text-text-tertiary disabled:cursor-default disabled:opacity-40"
          >
            모두 지우기
          </button>
        </div>

        {/* 인식이 틀린 글자는 여기서 바로 고칠 수 있다 */}
        <Textarea
          aria-label="발췌한 텍스트"
          className="mx-4 w-auto"
          maxLength={MAX_QUOTE_LENGTH}
          value={quotedText}
          placeholder={`사진에서 문장을 훑으면 여기에 담겨요.\n인식이 틀린 글자는 여기서 바로 고칠 수 있어요.`}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />

        <div
          className="flex gap-2 px-4 pt-4 pb-safe"
          // 홈 인디케이터에 버튼이 가리지 않게 한다
        >
          <button
            type="button"
            aria-label="다시 찍기"
            onClick={onRetake}
            className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-interactive-btn-primary text-icon-active"
          >
            <ResetIcon aria-hidden="true" className="size-6 text-icon-active" />
          </button>
          <Button
            className="h-[54px] flex-1 disabled:bg-interactive-btn-secondary disabled:opacity-40"
            disabled={quotedText.length === 0}
            onClick={onSubmit}
          >
            다음
          </Button>
        </div>
      </div>
    </section>
  )
}
