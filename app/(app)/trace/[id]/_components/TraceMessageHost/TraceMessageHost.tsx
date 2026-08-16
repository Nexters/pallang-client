'use client'

import { type ReactNode, useMemo, useState } from 'react'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

import { TraceMessageContext } from '../../_data/traceMessage.store'

/**
 * 흔적 보기 화면의 안내 스낵바를 그리는 자리.
 *
 * 목록 안에서 그리면 알리는 쪽과 함께 사라진다 — 차단하면 그 사람의 카드가 걷히고,
 * 딥링크로 지목된 흔적을 못 찾았다는 안내는 그 흔적이 없어서 띄우는 것이다.
 * 그래서 목록 바깥인 셸에서 그린다.
 */
export function TraceMessageHost({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const sink = useMemo(() => ({ show: setMessage }), [])

  return (
    <TraceMessageContext value={sink}>
      {children}
      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </TraceMessageContext>
  )
}
