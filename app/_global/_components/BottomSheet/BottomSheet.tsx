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
        className="relative flex flex-col gap-4 rounded-t-[20px] bg-bg-default px-4 pt-6 pb-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-title-18sb text-text-primary">{title}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex size-6 items-center justify-center text-icon-primary"
          >
            <CloseIcon aria-hidden="true" className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
