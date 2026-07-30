/** 드래그가 노트 위/아래 가장자리에 닿으면 자동 스크롤한다. 가장자리 폭·최대 속도. */
const EDGE = 40
const SPEED = 10

type AutoScrollInput = {
  /** 컨테이너 높이(px) */
  height: number
  /** 포인터 clientY */
  pointerY: number
  /** 컨테이너 top(clientY 기준) */
  top: number
}

/**
 * 포인터가 위/아래 가장자리(EDGE) 안이면 그 방향으로 스크롤할 px를 준다(위=음수, 아래=양수).
 * 안쪽이면 0. 침투 깊이에 비례하고 경계 밖은 최대치로 클램프한다.
 */
export function autoScrollDelta({ height, pointerY, top }: AutoScrollInput): number {
  const bottom = top + height
  if (pointerY < top + EDGE) {
    const intensity = Math.min(1, (top + EDGE - pointerY) / EDGE)
    return -Math.ceil(SPEED * intensity)
  }
  if (pointerY > bottom - EDGE) {
    const intensity = Math.min(1, (pointerY - (bottom - EDGE)) / EDGE)
    return Math.ceil(SPEED * intensity)
  }
  return 0
}
