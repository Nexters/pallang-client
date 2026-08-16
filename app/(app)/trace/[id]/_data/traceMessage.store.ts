'use client'

import { createContext } from 'react'

/**
 * 흔적 보기 화면의 안내 문구를 한 곳으로 모으는 통로.
 *
 * 알리는 쪽은 문구와 함께 사라질 수 있다 — 차단이 성공하면 서버가 그 사람의 흔적·댓글을 걸러 주므로
 * ⋯ 메뉴가 얹혀 있던 카드가 통째로 걷힌다. 스낵바를 그 안에서 그리면 결과를 알리기도 전에 함께
 * 언마운트되므로, 문구만 바깥으로 넘기고 그리는 자리는 셸(TraceMessageHost)에 둔다.
 */
export type TraceMessageSink = {
  show: (message: string) => void
}

export const TraceMessageContext = createContext<TraceMessageSink | null>(null)
