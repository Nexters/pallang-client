'use client'

import { useEffect, useRef } from 'react'

import CloseIcon from '../Icon/assets/close.svg'

type SnackbarProps = {
  message: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 3000

export function Snackbar({ message, onClose }: SnackbarProps) {
  const onCloseRef = useRef(onClose)

  // 매 렌더마다 ref 갱신 (exhaustive-deps 규칙 만족)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // 타이머는 message에만 의존 (부모 리렌더 시 리셋 안 됨)
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onCloseRef.current()
    }, AUTO_DISMISS_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [message])

  if (!message) return null

  return (
    <div
      role="status"
      className="absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-lg bg-bg-default px-4 py-3"
    >
      <span className="text-body-14md text-text-accent">{message}</span>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex size-5 shrink-0 items-center justify-center text-icon-primary"
      >
        <CloseIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
