'use client'

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useRef, useState } from 'react'

import { TAP_SLOP, TAP_TOLERANCE } from '../_data/gesture.constant'
import type { BlockBox, Point, Rect, ToggleMode } from '../_services/blockSelection.service'
import {
  applyToggle,
  pickBlockAt,
  rectFromPoints,
  resolveToggleMode,
  sameSelection,
  selectIndicesInRect,
} from '../_services/blockSelection.service'

/**
 * 화면 좌표를 블록 좌표계로 옮긴다.
 *
 * 경계는 확대가 반영된 값이라 좌상단은 그대로 맞고, 거기서 잰 거리만 배율로 나누면 된다.
 * 덕분에 블록 위치는 확대와 무관하게 한 좌표계에 머문다.
 */
function toLocalPoint(surface: HTMLElement, event: ReactPointerEvent, scale: number): Point {
  const bounds = surface.getBoundingClientRect()
  return { x: (event.clientX - bounds.left) / scale, y: (event.clientY - bounds.top) / scale }
}

/**
 * 사진 위를 끌거나 눌러 OCR 블록을 고른다. 한 제스처가 선택을 교체하지 않고 토글한다 —
 * 덜 인식된 부분은 이어서 더 고르고, 잘못 잡힌 블록만 다시 눌러 뺄 수 있다.
 *
 * 탭은 어절 하나를 뒤집고, 슬롭을 넘어 끌면 지나간 어절을 훑는다.
 * 추가/해제는 제스처가 **처음 닿는** 어절의 상태로 정한다. 시작점으로 정하면 고른 문장을
 * 지우려고 앞 여백에서부터 훑는 자연스러운 손짓이 추가 모드로 잠겨 아무 일도 안 일어난다.
 *
 * @param surfaceRef 블록 좌표계의 원점이 되는 요소(사진). 핸들러는 그보다 넓은 스테이지에 걸어도 된다.
 */
export function useBlockDragSelection(
  blocks: BlockBox[],
  selected: number[],
  onChange: (indices: number[]) => void,
  surfaceRef: RefObject<HTMLElement | null>,
  scale = 1,
) {
  // 확대할수록 좌표계상 여유·슬롭을 좁혀, 화면에서 보이는 크기는 배율과 상관없이 일정하게 둔다
  const tolerance = TAP_TOLERANCE / scale
  const slop = TAP_SLOP / scale
  const gestureRef = useRef<{ base: number[]; mode: ToggleMode | null; origin: Point } | null>(null)
  const [drag, setDrag] = useState<{ marquee: Rect | null; mode: ToggleMode | null } | null>(null)

  const update = (point: Point) => {
    const gesture = gestureRef.current
    if (!gesture) return
    const rect = rectFromPoints(gesture.origin, point)
    const isTap = Math.max(rect.width, rect.height) <= slop
    // 탭이면 시작점이 가리키는 어절 하나, 끌었으면 사각형이 지나간 어절 전부
    const swept = isTap
      ? [pickBlockAt(blocks, gesture.origin, tolerance)].filter((i): i is number => i !== null)
      : selectIndicesInRect(blocks, rect)
    // 처음 어절에 닿는 순간 모드를 정하고, 그 제스처가 끝날 때까지 바꾸지 않는다
    if (gesture.mode === null && swept.length > 0)
      gesture.mode = resolveToggleMode(gesture.base, swept)
    setDrag({ marquee: isTap ? null : rect, mode: gesture.mode })
    const next = gesture.mode ? applyToggle(gesture.base, swept, gesture.mode) : gesture.base
    // 고른 게 그대로면 알리지 않는다 — 여백을 탭했을 뿐인데 선택이 바뀐 것으로 읽히면
    // 손으로 고친 발췌문이 새 선택으로 덮여 사라진다
    if (!sameSelection(selected, next)) onChange(next)
  }

  const end = () => {
    gestureRef.current = null
    setDrag(null)
  }

  return {
    /** 진행 중인 제스처를 그 자리에서 끝낸다. 두 번째 손가락이 닿아 확대로 넘어갈 때 쓴다. */
    cancel: end,
    handlers: {
      onPointerCancel: end,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        const surface = surfaceRef.current
        if (!surface) return
        // 포인터를 캡처해야 사진 밖으로 끌어도 move/up 이벤트가 계속 들어온다
        event.currentTarget.setPointerCapture(event.pointerId)
        const origin = toLocalPoint(surface, event, scale)
        gestureRef.current = { base: selected, mode: null, origin }
        update(origin)
      },
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
        const surface = surfaceRef.current
        if (gestureRef.current && surface) update(toLocalPoint(surface, event, scale))
      },
      onPointerUp: end,
    },
    marquee: drag?.marquee ?? null,
    // 끄는 동안 이 제스처가 더하는 중인지 빼는 중인지 — 사각형 색을 갈라 보여준다.
    // 아직 어절에 닿지 않았으면 null이다.
    mode: drag?.mode ?? null,
  }
}
