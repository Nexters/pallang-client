'use client'

import { type ReactNode, useMemo, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

import { ModerationMessageContext } from '../../_data/moderationMessage.store'

/**
 * 신고·차단 결과 스낵바를 그리는 자리.
 *
 * ⋯ 메뉴 안에 두면 차단 성공과 동시에 사라진다 — 서버가 그 사람의 글을 걸러 준 목록이
 * 도착하면 메뉴가 얹힌 카드가 걷히기 때문이다. 목록 바깥에서 그려야 결과가 화면에 남는다.
 */
export function ModerationMessageHost({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const sink = useMemo(() => ({ show: setMessage }), [])

  return (
    <ModerationMessageContext value={sink}>
      {children}
      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </ModerationMessageContext>
  )
}
