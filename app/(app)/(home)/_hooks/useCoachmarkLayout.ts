'use client'

import type { RefObject } from 'react'
import { useLayoutEffect, useState } from 'react'

import { getCoachmarkTargetSelector } from '@/app/_global/_data/coachmarkTarget.constant'

import type { CoachmarkStep } from '../_data/coachmark.constant'
import type { CoachmarkLayout, CoachmarkRect } from '../_services/coachmarkLayout.service'
import { getCoachmarkLayout, unionRects } from '../_services/coachmarkLayout.service'

function toRect(element: Element): CoachmarkRect {
  const { height, left, top, width } = element.getBoundingClientRect()

  return { height, left, top, width }
}

/** 단계에 적힌 마커를 앞에서부터 찾아, 처음 잡힌 마커의 엘리먼트를 전부 합쳐 하나의 rect로 만든다. */
function readTargetRect(step: CoachmarkStep): CoachmarkRect | null {
  for (const target of step.targets) {
    const elements = [...document.querySelectorAll(getCoachmarkTargetSelector(target))]
    const rect = unionRects(elements.map(toRect))
    if (rect) return rect
  }

  return null
}

/**
 * 현재 단계가 비출 대상을 DOM에서 찾아 재고, 구멍·말풍선 좌표로 바꾼다.
 *
 * 대상을 못 찾으면 null을 돌려준다 — 호출부는 그때 아무것도 그리지 않아,
 * 가리킬 곳 없는 딤이 화면을 덮고 탭까지 삼키는 상태가 되지 않는다.
 */
export function useCoachmarkLayout(
  hostRef: RefObject<HTMLElement | null>,
  step: CoachmarkStep,
): CoachmarkLayout | null {
  const [layout, setLayout] = useState<CoachmarkLayout | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const host = hostRef.current
      const targetRect = readTargetRect(step)
      if (!host || !targetRect) {
        setLayout(null)
        return
      }

      setLayout(getCoachmarkLayout({ hostRect: toRect(host), radius: step.holeRadius, targetRect }))
    }

    measure()
    // 책 목록이 막 도착했거나 안드로이드가 하단 인셋을 늦게 덮어써 레이아웃이 아직 정착하지
    // 않았을 수 있다. 다음 프레임에 한 번 더 재서 구멍이 어긋난 채 굳지 않게 한다.
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [hostRef, step])

  return layout
}
