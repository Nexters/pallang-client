'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { MAX_QUOTE_LENGTH } from '../../_data/quote.constant'

type OcrQuoteSheetProps = {
  onClose: () => void
  onRetake: () => void
  onSubmit: () => void
  quotedText: string
}

export function OcrQuoteSheet({ onClose, onRetake, onSubmit, quotedText }: OcrQuoteSheetProps) {
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

        <div className="mx-4 flex h-[206px] flex-col gap-2 rounded-lg bg-bg-surface p-4">
          {quotedText ? (
            <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-body-16md text-text-secondary">
              {quotedText}
            </p>
          ) : (
            <p className="min-h-0 flex-1 text-body-16md text-text-placeholder/50">
              발췌하고 싶은 텍스트를 드래그해주세요.
              <br />
              최대 {MAX_QUOTE_LENGTH}자까지 가능해요.
            </p>
          )}
          <p className="shrink-0 self-end text-body-16md">
            <span className="text-text-secondary">{quotedText.length}</span>
            <span className="text-text-tertiary"> / {MAX_QUOTE_LENGTH}</span>
          </p>
        </div>

        <div
          className="flex gap-2 p-4"
          // 홈 인디케이터에 버튼이 가리지 않게 한다
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
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
