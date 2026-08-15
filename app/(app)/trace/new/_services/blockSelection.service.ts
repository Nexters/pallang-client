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

/** 사각형에 걸친 블록들의 인덱스를 읽기 순서(배열 순서)대로 반환한다. */
export function selectIndicesInRect(blocks: BlockBox[], rect: Rect): number[] {
  return blocks.reduce<number[]>((indices, box, index) => {
    if (overlaps(box, rect)) indices.push(index)
    return indices
  }, [])
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
