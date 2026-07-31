'use client'

import { useEffect, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { cn } from '@/app/_global/_services/cn.service'

import CloseIcon from '../Icon/assets/close.svg'

type SnackbarProps = {
  message: string
  /** message 앞머리에서 강조할 부분. 시안(2469:13096)의 오렌지 볼드 대목이다. */
  highlight?: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 3000

/** 강조 대목과 나머지로 가른다. highlight가 앞머리가 아니면 통째로 본문으로 둔다. */
function splitHighlight(message: string, highlight?: string) {
  if (!highlight || !message.startsWith(highlight)) return { head: '', tail: message }
  return { head: highlight, tail: message.slice(highlight.length) }
}

export function Snackbar({ highlight, message, onClose }: SnackbarProps) {
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

  const { head, tail } = splitHighlight(shownMessage, highlight)

  return (
    <div
      role="status"
      data-state={state}
      className={cn(
        'absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-2xl bg-bg-default px-4 py-3',
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-[state=entering]:translate-y-2 data-[state=entering]:opacity-0',
        'data-[state=exiting]:translate-y-2 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
        // 사라지는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
        'data-[state=exiting]:pointer-events-none',
      )}
    >
      <p className="text-body-14md text-text-secondary">
        {head && <span className="text-title-14bd text-text-accent">{head}</span>}
        {tail}
      </p>
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
