import { describe, expect, it } from 'vitest'

import {
  applyToggle,
  type BlockBox,
  pickBlockAt,
  rectFromPoints,
  resolveToggleMode,
  sameSelection,
  selectIndicesInRect,
} from '../_services/blockSelection.service'

const blocks: BlockBox[] = [
  { height: 10, left: 0, top: 0, width: 30 }, // 0: 첫 줄 왼쪽
  { height: 10, left: 40, top: 0, width: 30 }, // 1: 첫 줄 오른쪽
  { height: 10, left: 0, top: 20, width: 30 }, // 2: 둘째 줄 왼쪽
]

describe('rectFromPoints', () => {
  it('오른쪽 아래로 끌면 시작점이 좌상단이 된다', () => {
    expect(rectFromPoints({ x: 5, y: 5 }, { x: 25, y: 15 })).toEqual({
      height: 10,
      left: 5,
      top: 5,
      width: 20,
    })
  })

  it('왼쪽 위로 끌어도 양수 크기의 같은 사각형을 만든다', () => {
    expect(rectFromPoints({ x: 25, y: 15 }, { x: 5, y: 5 })).toEqual({
      height: 10,
      left: 5,
      top: 5,
      width: 20,
    })
  })
})

describe('selectIndicesInRect', () => {
  it('사각형에 걸친 블록만 읽기 순서대로 고른다', () => {
    const rect = rectFromPoints({ x: 10, y: 2 }, { x: 50, y: 8 })
    expect(selectIndicesInRect(blocks, rect)).toEqual([0, 1])
  })

  it('여러 줄에 걸치면 지나간 줄을 모두 고른다', () => {
    const rect = rectFromPoints({ x: 5, y: 5 }, { x: 10, y: 25 })
    expect(selectIndicesInRect(blocks, rect)).toEqual([0, 2])
  })

  it('크기가 0인 사각형(탭)은 그 지점의 블록 하나를 고른다', () => {
    const rect = rectFromPoints({ x: 45, y: 5 }, { x: 45, y: 5 })
    expect(selectIndicesInRect(blocks, rect)).toEqual([1])
  })

  it('아무 블록에도 닿지 않으면 빈 배열이다', () => {
    const rect = rectFromPoints({ x: 100, y: 100 }, { x: 110, y: 110 })
    expect(selectIndicesInRect(blocks, rect)).toEqual([])
  })
})

describe('pickBlockAt', () => {
  it('블록 안을 누르면 그 블록이다', () => {
    expect(pickBlockAt(blocks, { x: 45, y: 5 }, 6)).toBe(1)
  })

  // 어절은 손가락 끝보다 작아 살짝 빗나가기 쉽다. 빗나간 때만 여유가 일한다.
  it('살짝 빗나가면 여유 안쪽의 블록을 끌어온다', () => {
    expect(pickBlockAt(blocks, { x: 33, y: 5 }, 0)).toBeNull()
    expect(pickBlockAt(blocks, { x: 33, y: 5 }, 6)).toBe(0)
  })

  // 어절 사이 간격은 화면맞춤 배율에서 몇 px에 불과해, 여유 안에 양옆이 다 들어오기 쉽다.
  // 한 번 눌러 두 어절이 잡히면 안 되니 가장 가까운 하나만 고른다.
  it('여유 안에 여럿이 있어도 가장 가까운 하나만 고른다', () => {
    // 블록 0은 x≤30, 블록 1은 x≥40. x=33은 0에 3px, 1에 7px
    expect(pickBlockAt(blocks, { x: 33, y: 5 }, 12)).toBe(0)
    expect(pickBlockAt(blocks, { x: 37, y: 5 }, 12)).toBe(1)
  })

  // OCR 상자는 넉넉해서 윗줄과 아랫줄이 살짝 겹친다. 겹친 자리를 눌렀을 때 읽기 순서 첫 번째를
  // 잡으면 늘 윗줄만 걸린다 — 빼려던 아랫줄 어절 대신 윗줄이 더해지는 식으로 엇나간다.
  it('겹친 자리를 누르면 중심이 가장 가까운 블록 하나다', () => {
    const overlapping: BlockBox[] = [
      { height: 12, left: 0, top: 0, width: 30 }, // 0: 윗줄, y 0~12
      { height: 12, left: 0, top: 10, width: 30 }, // 1: 아랫줄, y 10~22 (2px 겹침)
    ]
    // y=11.5는 둘 다 안이지만 아랫줄 중심(16)에 더 가깝다
    expect(pickBlockAt(overlapping, { x: 10, y: 11.5 }, 0)).toBe(1)
    // y=10.5는 윗줄 중심(6)에 더 가깝다
    expect(pickBlockAt(overlapping, { x: 10, y: 10.5 }, 0)).toBe(0)
  })

  it('여유 밖은 잡지 않는다', () => {
    expect(pickBlockAt(blocks, { x: 100, y: 100 }, 6)).toBeNull()
  })
})

describe('resolveToggleMode', () => {
  it('고르지 않은 블록 하나를 훑으면 추가 모드다', () => {
    expect(resolveToggleMode([1], [0], null)).toBe('add')
  })

  it('이미 고른 블록 하나를 훑으면 해제 모드다', () => {
    expect(resolveToggleMode([0, 1], [0], null)).toBe('remove')
  })

  // 고른 문장 살짝 앞에서 훑기 시작하는 게 자연스러운 손짓이다. 처음 닿는 어절 하나로 잠그면
  // 그 앞 어절이 안 고른 거라 추가 모드가 돼 문장이 안 지워진다. 훑은 영역 전체의 다수가 정한다.
  it('훑은 영역에 고른 게 더 많으면 해제 모드다', () => {
    expect(resolveToggleMode([2, 3, 4], [1, 2, 3, 4], null)).toBe('remove')
  })

  it('훑은 영역에 고르지 않은 게 더 많으면 추가 모드다', () => {
    expect(resolveToggleMode([4], [1, 2, 3, 4], null)).toBe('add')
  })

  // 반반이면 끌던 방향을 지킨다 — 경계에서 한 어절 왔다 갔다 할 때마다 뒤집히지 않게
  it('반반이면 이전 모드를 유지한다', () => {
    expect(resolveToggleMode([0, 1], [0, 1, 2, 3], 'remove')).toBe('remove')
    expect(resolveToggleMode([0, 1], [0, 1, 2, 3], 'add')).toBe('add')
  })

  it('반반인데 이전 모드가 없으면 추가 모드다', () => {
    expect(resolveToggleMode([0], [0, 1], null)).toBe('add')
  })

  it('아무것도 훑지 않았으면 이전 모드를 유지한다', () => {
    expect(resolveToggleMode([0], [], null)).toBeNull()
    expect(resolveToggleMode([0], [], 'remove')).toBe('remove')
  })
})

describe('sameSelection', () => {
  it('같은 인덱스가 같은 순서로 있으면 같은 선택이다', () => {
    expect(sameSelection([0, 2], [0, 2])).toBe(true)
  })

  it('빈 선택끼리도 같은 선택이다', () => {
    expect(sameSelection([], [])).toBe(true)
  })

  it('개수가 다르면 다른 선택이다', () => {
    expect(sameSelection([0], [0, 1])).toBe(false)
  })

  it('내용이 다르면 다른 선택이다', () => {
    expect(sameSelection([0, 1], [0, 2])).toBe(false)
  })

  it('applyToggle이 만든 새 배열이라도 내용이 같으면 같은 선택이다', () => {
    // 빈 자리를 탭하면 지나간 블록이 없어 내용이 그대로인 새 배열이 나온다.
    // 이걸 변경으로 읽으면 손으로 고친 발췌문이 날아간다.
    const selected = [0, 1]
    expect(sameSelection(selected, applyToggle(selected, [], 'add'))).toBe(true)
  })
})

describe('applyToggle', () => {
  it('추가 모드는 기존 선택에 더하고 읽기 순서를 유지한다', () => {
    expect(applyToggle([2], [0, 1], 'add')).toEqual([0, 1, 2])
  })

  it('추가 모드는 이미 고른 블록을 중복해 넣지 않는다', () => {
    expect(applyToggle([0, 1], [1, 2], 'add')).toEqual([0, 1, 2])
  })

  it('해제 모드는 지나간 블록만 뺀다', () => {
    expect(applyToggle([0, 1, 2], [1], 'remove')).toEqual([0, 2])
  })

  it('한 제스처 안에서는 블록마다 뒤집지 않는다', () => {
    // 지나간 블록 중 일부만 이미 골라져 있어도 모드는 하나로 유지된다
    expect(applyToggle([0], [0, 1], 'add')).toEqual([0, 1])
    expect(applyToggle([0], [0, 1], 'remove')).toEqual([])
  })
})
