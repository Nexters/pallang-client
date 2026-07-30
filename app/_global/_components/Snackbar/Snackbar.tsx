'use client'

import { useEffect, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { cn } from '@/app/_global/_services/cn.service'

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

  const { shouldRender, state } = useExitTransition(Boolean(message), MOTION_DURATION.fast)
  // 빈 문자열이 '닫힘'을 뜻하므로 null로 정규화해서 넘긴다 — 퇴장 중 문구가 비지 않게 한다
  const shownMessage = useLastPresent(message || null)

  if (!shouldRender || shownMessage === null) return null

  return (
    <div
      role="status"
      data-state={state}
      className={cn(
        'absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-lg bg-bg-default px-4 py-3',
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-[state=entering]:translate-y-2 data-[state=entering]:opacity-0',
        'data-[state=exiting]:translate-y-2 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
        // 사라지는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
        'data-[state=exiting]:pointer-events-none',
      )}
    >
      <span className="text-body-14md text-text-accent">{shownMessage}</span>
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
