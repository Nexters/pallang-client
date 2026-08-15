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

function indicesTouching(blocks: BlockBox[], rect: Rect): number[] {
  return blocks.reduce<number[]>((indices, box, index) => {
    if (overlaps(box, rect)) indices.push(index)
    return indices
  }, [])
}

/** 사각형과 블록 사이의 빈 간격. 축마다 잰 뒤 큰 쪽을 쓴다 — 여유 판정(축별 확장)과 같은 잣대다. */
function gapBetween(box: BlockBox, rect: Rect): number {
  const gapX = Math.max(0, box.left - (rect.left + rect.width), rect.left - (box.left + box.width))
  const gapY = Math.max(0, box.top - (rect.top + rect.height), rect.top - (box.top + box.height))
  return Math.max(gapX, gapY)
}

/** 여유 안에서 가장 가까운 블록 하나. 같은 거리면 읽기 순서가 앞선 쪽이다. */
function nearestWithin(blocks: BlockBox[], rect: Rect, tolerance: number): number[] {
  const nearest = blocks.reduce<{ gap: number; index: number } | null>((best, box, index) => {
    const gap = gapBetween(box, rect)
    return gap <= tolerance && (!best || gap < best.gap) ? { gap, index } : best
  }, null)
  return nearest ? [nearest.index] : []
}

/**
 * 사각형에 걸친 블록들의 인덱스를 읽기 순서(배열 순서)대로 반환한다.
 *
 * tolerance는 빗나갔을 때만 쓰는 여유다. 정확히 닿은 블록이 있으면 그것만 돌려주고,
 * 없을 때만 여유 안에서 가장 가까운 하나를 고른다. 어절 사이 간격은 여유보다 좁기 일쑤라,
 * 여유 안의 것을 다 주면 사이를 한 번 눌렀을 때 양옆 두 어절이 함께 발췌문에 낀다.
 */
export function selectIndicesInRect(blocks: BlockBox[], rect: Rect, tolerance = 0): number[] {
  const touching = indicesTouching(blocks, rect)
  if (touching.length > 0 || tolerance <= 0) return touching
  return nearestWithin(blocks, rect, tolerance)
}

export type ToggleMode = 'add' | 'remove'

/**
 * 제스처가 처음 닿은 블록의 상태로 모드를 정한다.
 * 이미 고른 블록에서 시작하면 그 제스처는 해제만, 아니면 추가만 한다.
 * (한 제스처가 블록마다 뒤집으면 지나간 자리가 뒤죽박죽이 된다.)
 */
export function resolveToggleMode(selected: number[], touched: number[]): ToggleMode {
  const first = touched[0]
  return first !== undefined && selected.includes(first) ? 'remove' : 'add'
}

/**
 * 두 선택이 같은지 본다. 양쪽 모두 읽기 순서로 정렬돼 있어 자리끼리 비교하면 된다.
 *
 * applyToggle은 지나간 블록이 없어도 새 배열을 만든다. 그걸 변경으로 읽으면 사진 여백을
 * 탭하기만 해도 선택이 바뀐 것으로 취급돼, 손으로 고친 발췌문이 되돌릴 수 없이 날아간다.
 */
export function sameSelection(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((index, at) => index === b[at])
}

/** 제스처가 시작될 때의 선택에 지나간 블록을 더하거나 뺀다. 결과는 읽기 순서를 유지한다. */
export function applyToggle(base: number[], swept: number[], mode: ToggleMode): number[] {
  const sweptSet = new Set(swept)
  const kept = base.filter((index) => mode === 'add' || !sweptSet.has(index))
  if (mode === 'remove') return kept
  const baseSet = new Set(base)
  return [...kept, ...swept.filter((index) => !baseSet.has(index))].sort((a, b) => a - b)
}
