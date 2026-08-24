'use client'

import { useEffect, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { cn } from '@/app/_global/_services/cn.service'

import CloseIcon from '../Icon/assets/close.svg'

type SnackbarProps = {
  message: string
  /**
   * 이번에 띄운 안내를 가리키는 값. 바뀌면 문구가 같아도 새 안내로 보고 자동 닫힘 타이머를
   * 처음부터 다시 센다.
   *
   * 타이머는 문구가 바뀔 때만 다시 시작한다 — 부모가 다른 이유로 리렌더할 때마다 3초가
   * 연장되면 안 되기 때문이다. 그래서 문구가 글자 그대로 같으면(차단 해제 안내처럼 대상이
   * 안 들어간 고정 문구, 닉네임이 같은 카드 두 장) 이전 타이머가 그대로 흘러 두 번째 안내는
   * 남은 시간만 보인다. 그런 화면은 대상 id처럼 매번 달라지는 값을 여기에 넘긴다.
   */
  messageKey?: string | number
  /** message 앞머리에서 강조할 부분. 시안의 오렌지 볼드 대목이다. */
  highlight?: string
  /**
   * **바의 색이 아니라 바를 얹는 화면의 밝기다.** 이름이 직관과 반대로 읽히니 주의한다:
   * - `'light'` = 밝은 화면용 → 어두운 바
   * - `'dark'` = 어두운 화면용 → 흰 바
   *
   * 대부분의 화면이 어두워 기본은 'dark'(= 흰 바)다. 마이페이지 계열처럼 흰 화면에 얹을
   * 때는 반드시 `tone="light"`를 명시한다 — 빠뜨리면 흰 바가 흰 배경에 묻혀 안 보인다.
   */
  tone?: 'light' | 'dark'
  /**
   * 우측에 세우는 되돌리기 버튼의 문구. 주면 닫기(X) 자리를 이 버튼이 대신한다
   * — 되돌릴 수 있는 알림은 닫기보다 되돌리기가 할 일이다(좋아요 관리 `취소`).
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
  messageKey,
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

  // 타이머를 다시 셀 기준. 문구나 messageKey가 바뀔 때만 값이 달라지므로, 부모가 같은 props로
  // 리렌더해도 남은 시간이 늘어나지 않는다. 두 값을 배열로 직렬화해 경계를 흐리지 않는다.
  const dismissKey = message ? JSON.stringify([messageKey ?? '', message]) : ''

  useEffect(() => {
    if (!dismissKey) return
    const timer = setTimeout(() => {
      onCloseRef.current()
    }, AUTO_DISMISS_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [dismissKey])

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
        'absolute inset-x-4 bottom-safe-24 z-30 flex items-center justify-between gap-4 rounded-2xl px-4 py-3',
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
