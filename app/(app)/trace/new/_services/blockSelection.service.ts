export type Point = { x: number; y: number }

export type Rect = { height: number; left: number; top: number; width: number }

/** OCR 블록의 화면상 위치. 값은 이미지 표시 크기 기준(원본 좌표 × scale)이다. */
export type BlockBox = Rect

/** 드래그 시작점과 현재점으로 사각형을 만든다. 어느 방향으로 끌어도 양수 크기가 된다. */
export function rectFromPoints(from: Point, to: Point): Rect {
  return {
    height: Math.abs(to.y - from.y),
    left: Math.min(from.x, to.x),
    top: Math.min(from.y, to.y),
    width: Math.abs(to.x - from.x),
  }
}

function overlaps(box: BlockBox, rect: Rect): boolean {
  // 경계 포함 비교라 크기 0인 사각형(=탭)도 블록 안에 있으면 선택된다
  return (
    box.left <= rect.left + rect.width &&
    box.left + box.width >= rect.left &&
    box.top <= rect.top + rect.height &&
    box.top + box.height >= rect.top
  )
}

/** 사각형(드래그)에 걸친 블록들의 인덱스를 읽기 순서(배열 순서)대로 반환한다. */
export function selectIndicesInRect(blocks: BlockBox[], rect: Rect): number[] {
  return blocks.reduce<number[]>((indices, box, index) => {
    if (overlaps(box, rect)) indices.push(index)
    return indices
  }, [])
}

/** 점과 블록 사이의 빈 간격. 축마다 잰 뒤 큰 쪽을 쓴다. 안에 있으면 0이다. */
function gapFrom(box: BlockBox, point: Point): number {
  const gapX = Math.max(0, box.left - point.x, point.x - (box.left + box.width))
  const gapY = Math.max(0, box.top - point.y, point.y - (box.top + box.height))
  return Math.max(gapX, gapY)
}

/** 점에서 블록 중심까지의 거리. 겹친 상자 가운데 어느 쪽을 눌렀는지 가른다. */
function distanceToCenter(box: BlockBox, point: Point): number {
  return Math.hypot(box.left + box.width / 2 - point.x, box.top + box.height / 2 - point.y)
}

/**
 * 한 점(탭)이 가리키는 블록 하나. 없으면 null.
 *
 * 안에 든 블록이 있으면 그중 중심이 가장 가까운 것 — OCR 상자는 넉넉해서 윗줄·아랫줄이 겹치는데,
 * 읽기 순서 첫 번째를 잡으면 늘 윗줄만 걸려 빼려던 어절 대신 엉뚱한 게 더해진다.
 * 안에 든 게 없으면 tolerance 안에서 가장 가까운 것 — 어절은 손가락 끝보다 작아 살짝 빗나가기 쉽다.
 * 어느 쪽이든 하나만 돌려준다. 어절 사이 간격은 tolerance보다 좁기 일쑤라, 여유 안의 것을 다 주면
 * 사이를 한 번 눌렀을 때 양옆 두 어절이 함께 발췌문에 낀다.
 */
export function pickBlockAt(blocks: BlockBox[], point: Point, tolerance: number): number | null {
  const best = blocks.reduce<{ gap: number; index: number; toCenter: number } | null>(
    (current, box, index) => {
      const gap = gapFrom(box, point)
      if (gap > tolerance) return current
      const toCenter = distanceToCenter(box, point)
      // 간격이 0(안에 듦)인 쪽이 늘 우선이고, 같은 간격끼리는 중심이 가까운 쪽
      const better =
        !current || gap < current.gap || (gap === current.gap && toCenter < current.toCenter)
      return better ? { gap, index, toCenter } : current
    },
    null,
  )
  return best ? best.index : null
}

/**
 * 두 선택이 같은지 본다. 양쪽 모두 읽기 순서로 정렬돼 있어 자리끼리 비교하면 된다.
 *
 * applySweep은 지나간 블록이 없어도 새 배열을 만든다. 그걸 변경으로 읽으면 사진 여백을
 * 탭하기만 해도 선택이 바뀐 것으로 취급돼, 손으로 고친 발췌문이 되돌릴 수 없이 날아간다.
 */
export function sameSelection(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((index, at) => index === b[at])
}

/**
 * 제스처가 시작될 때의 선택(base)에 지나간 블록(swept)을 적용한다.
 *
 * 지나간 것 중 고른 게 하나라도 있으면 **해제만** 한다 — 고른 건 풀리고 안 고른 건 그대로.
 * 하나도 없을 때만 전부 켠다. 고른 문장을 지우려고 그 앞 안 고른 어절에서부터 훑는 게 자연스러운
 * 손짓인데, 각자 뒤집으면 앞의 안 고른 어절이 켜져 깨끗하게 지워지지 않는다. 대가는 고른 문장의
 * 끝 어절 위에서 시작해 이어 붙이면 그 끝 어절이 풀린다는 것 — 끝 어절 바로 뒤에서 시작하면 된다.
 *
 * 매번 base에 대해 지금 사각형 안의 것을 적용하므로, 끌다가 되돌아와 사각형에서 벗어난 블록은
 * 원래대로 돌아간다. 결과는 읽기 순서를 유지한다.
 */
export function applySweep(base: number[], swept: number[]): number[] {
  const baseSet = new Set(base)
  const sweptSet = new Set(swept)
  const touchesPicked = swept.some((index) => baseSet.has(index))
  if (touchesPicked) return base.filter((index) => !sweptSet.has(index))
  return [...base, ...swept].sort((a, b) => a - b)
}
