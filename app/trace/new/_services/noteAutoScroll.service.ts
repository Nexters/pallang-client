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

/**
 * 스크롤 컨테이너를 delta만큼 세로로 이동한다.
 * 훅 안에서 ref로 받은 DOM 노드를 직접 대입하면 react-hooks/immutability 룰이
 * "훅 인자 변형"으로 오인하므로, 뮤테이션을 훅 바깥의 일반 함수로 분리한다.
 */
export function scrollByDelta(element: HTMLElement, delta: number): void {
  element.scrollTop += delta
}
