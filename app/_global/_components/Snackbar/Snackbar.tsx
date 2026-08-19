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
  /**
   * 놓이는 배경. 어두운 화면에는 흰 바, 밝은 화면에는 어두운 바를 얹어야 배경과 붙지 않는다.
   * 대부분의 화면이 어두워 기본은 'dark'다(차단 관리 218:12142가 밝은 면 쪽 시안).
   */
  tone?: 'light' | 'dark'
  /**
   * 우측에 세우는 되돌리기 버튼의 문구. 주면 닫기(X) 자리를 이 버튼이 대신한다
   * — 되돌릴 수 있는 알림은 닫기보다 되돌리기가 할 일이다(좋아요 관리 225:12867 `취소`).
   */
  actionLabel?: string
  onAction?: () => void
  onClose: () => void
}

const AUTO_DISMISS_MS = 3000

// 문구·닫기 아이콘은 이 색을 상속한다 — 두 곳에 따로 걸면 톤이 갈린다
const TONE_CLASS = {
  light: 'bg-bg-black text-text-inverse',
  dark: 'bg-bg-default text-text-secondary',
} as const

/** 강조 대목과 나머지로 가른다. highlight가 앞머리가 아니면 통째로 본문으로 둔다. */
function splitHighlight(message: string, highlight?: string) {
  if (!highlight || !message.startsWith(highlight)) return { head: '', tail: message }
  return { head: highlight, tail: message.slice(highlight.length) }
}

export function Snackbar({
  highlight,
  message,
  tone = 'dark',
  actionLabel,
  onAction,
  onClose,
}: SnackbarProps) {
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
        'absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-2xl px-4 py-3',
        TONE_CLASS[tone],
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-[state=entering]:translate-y-2 data-[state=entering]:opacity-0',
        'data-[state=exiting]:translate-y-2 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
        // 사라지는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
        'data-[state=exiting]:pointer-events-none',
      )}
    >
      <p className="text-body-14md">
        {head && <span className="text-title-14bd text-text-accent">{head}</span>}
        {tail}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 whitespace-nowrap text-body-14md text-text-accent press"
        >
          {actionLabel}
        </button>
      ) : (
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-5 shrink-0 items-center justify-center"
        >
          <CloseIcon aria-hidden="true" className="size-5" />
        </button>
      )}
    </div>
  )
}
