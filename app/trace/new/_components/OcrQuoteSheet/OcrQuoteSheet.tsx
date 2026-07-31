'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { MAX_QUOTE_LENGTH } from '../../_data/quote.constant'

type OcrQuoteSheetProps = {
  onChange: (quotedText: string) => void
  onClose: () => void
  onRetake: () => void
  onSubmit: () => void
  quotedText: string
}

export function OcrQuoteSheet({
  onChange,
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
          <TopBar.Title as="h1">사진으로 입력</TopBar.Title>
          <TopBar.Spacer />
          <TopBar.Action aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </TopBar.Action>
        </TopBar.Root>

        {/* 인식이 틀린 글자는 여기서 바로 고칠 수 있다 */}
        <Textarea
          aria-label="발췌한 텍스트"
          className="mx-4 w-auto"
          maxLength={MAX_QUOTE_LENGTH}
          value={quotedText}
          placeholder={`발췌하고 싶은 텍스트를 드래그해주세요.\n최대 ${String(MAX_QUOTE_LENGTH)}자까지 가능해요.`}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />

        <div
          className="flex gap-2 p-4"
          // 홈 인디케이터에 버튼이 가리지 않게 한다
          style={{ paddingBottom: 'max(1rem, var(--safe-bottom))' }}
        >
          <button
            type="button"
            aria-label="다시 찍기"
            onClick={onRetake}
            className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-interactive-btn-primary text-icon-active"
          >
            <CameraIcon aria-hidden="true" className="size-6 text-icon-active" />
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
