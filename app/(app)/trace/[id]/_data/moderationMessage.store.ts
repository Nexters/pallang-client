'use client'

import { createContext } from 'react'

/**
 * 신고·차단 결과 문구를 화면 한 곳으로 모으는 통로.
 *
 * 알리는 쪽(⋯ 메뉴)은 결과와 동시에 사라질 수 있다 — 차단이 성공하면 서버가 그 사람의
 * 흔적·댓글을 걸러 주므로 메뉴가 얹혀 있던 카드가 통째로 걷힌다. 스낵바를 그 안에서 그리면
 * 결과를 알리기도 전에 함께 언마운트되므로, 문구만 바깥으로 넘기고 그리는 자리는 목록 위에 둔다.
 */
export type ModerationMessageSink = {
  show: (message: string) => void
}

export const ModerationMessageContext = createContext<ModerationMessageSink | null>(null)
