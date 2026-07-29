import { describe, expect, it } from 'vitest'

import {
  type BlockBox,
  rectFromPoints,
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
