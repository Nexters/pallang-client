'use client'

import { type ReactNode, useEffect } from 'react'

import CloseIcon from '../Icon/assets/close.svg'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label="배경 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex flex-col rounded-t-[32px] bg-bg-default pt-6 pb-4"
        // 홈 인디케이터에 시트 내용이 가리지 않게 한다
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <h2 className="min-w-px flex-1 text-title-18bd text-text-secondary">{title}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-primary"
          >
            <CloseIcon aria-hidden="true" className="size-6 text-icon-primary" />
          </button>
        </div>
        {/* 시안의 시트는 본문이 자기 여백을 가진다 — 패널은 가로 여백을 두지 않는다 */}
        <div className="flex flex-col gap-4 p-4">{children}</div>
      </div>
    </div>
  )
}
