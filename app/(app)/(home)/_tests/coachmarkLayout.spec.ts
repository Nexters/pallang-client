import { describe, expect, it } from 'vitest'

import type { CoachmarkLayout } from '../_services/coachmarkLayout.service'
import {
  COACHMARK_TAIL_WIDTH,
  COACHMARK_TOOLTIP_WIDTH,
  getCoachmarkLayout,
  unionRects,
} from '../_services/coachmarkLayout.service'

// 시안 기준 화면(375×812). 아래 대상 좌표는 시안 3장에서 실측한 값이다.
const HOST_RECT = { height: 812, left: 0, top: 0, width: 375 }
const TRACE_CREATE_RECT = { height: 52, left: 148, top: 744, width: 80 }
const BOOK_EXPLORE_RECT = { height: 46, left: 84, top: 747, width: 48 }
const ACTIVE_BOOK_RECT = { height: 410, left: 77, top: 266, width: 220 }

function getTailCenterX(layout: CoachmarkLayout): number {
  return layout.tooltip.left + layout.tailLeft + COACHMARK_TAIL_WIDTH / 2
}

describe('coachmarkLayout.service', () => {
  it('말풍선은 대상 중심에 맞춰 서고 꼬리가 대상 중심을 가리킨다', () => {
    const layout = getCoachmarkLayout({
      hostRect: HOST_RECT,
      radius: 9999,
      targetRect: TRACE_CREATE_RECT,
    })

    expect(layout.tooltip.left).toBe(188 - COACHMARK_TOOLTIP_WIDTH / 2)
    expect(getTailCenterX(layout)).toBe(188)
  })

  // 대상이 화면 가장자리에 있으면 중심에 맞춘 말풍선이 화면 밖으로 나간다
  it('가장자리 대상이면 말풍선은 여백에서 멈추고 꼬리만 대상 중심에 남는다', () => {
    const layout = getCoachmarkLayout({
      hostRect: HOST_RECT,
      radius: 8,
      targetRect: BOOK_EXPLORE_RECT,
    })

    expect(layout.tooltip.left).toBe(16)
    expect(getTailCenterX(layout)).toBe(108)
  })

  it('꼬리 끝은 대상 위 24px에 선다', () => {
    const layout = getCoachmarkLayout({
      hostRect: HOST_RECT,
      radius: 4,
      targetRect: ACTIVE_BOOK_RECT,
    })

    expect(HOST_RECT.height - layout.tooltip.bottom).toBe(ACTIVE_BOOK_RECT.top - 24)
  })

  // 오버레이는 창이 아니라 앱 셸(가운데 정렬된 max-w 박스) 기준이라 좌표를 옮겨야 한다
  it('구멍은 대상 크기 그대로이되 좌표는 오버레이 기준으로 옮겨진다', () => {
    const layout = getCoachmarkLayout({
      hostRect: { height: 812, left: 100, top: 0, width: 375 },
      radius: 4,
      targetRect: { ...ACTIVE_BOOK_RECT, left: 177 },
    })

    expect(layout.hole).toEqual({ height: 410, left: 77, radius: 4, top: 266, width: 220 })
  })

  // 2단계 대상은 책 카드(340)와 그 아래 정보 행(50)이 20px 떨어져 있는 두 조각이다
  it('나뉜 대상 조각들은 하나의 구멍으로 합쳐진다', () => {
    const union = unionRects([
      { height: 340, left: 77, top: 266, width: 220 },
      { height: 50, left: 77, top: 626, width: 220 },
    ])

    expect(union).toEqual(ACTIVE_BOOK_RECT)
  })

  it('비출 대상이 하나도 없으면 합칠 것도 없다', () => {
    expect(unionRects([])).toBeNull()
  })
})
