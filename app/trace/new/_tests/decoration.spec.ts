import { describe, expect, it } from 'vitest'

import { splitByDecorations } from '../_services/decoration.service'
import type { DraftDecoration } from '../_types/traceDraft.type'

const deco = (startOffset: number, endOffset: number): DraftDecoration => ({
  startOffset,
  endOffset,
  effectType: 'HIGHLIGHT',
  color: '#FFE08A',
})

describe('splitByDecorations', () => {
  it('효과가 없으면 통째로 한 조각이다', () => {
    expect(splitByDecorations('안녕하세요', [])).toEqual([{ text: '안녕하세요', decoration: null }])
  })

  it('빈 문자열은 빈 배열이다', () => {
    expect(splitByDecorations('', [])).toEqual([])
  })

  it('가운데 범위를 앞·효과·뒤 세 조각으로 나눈다', () => {
    expect(splitByDecorations('안녕하세요', [deco(1, 3)])).toEqual([
      { text: '안', decoration: null },
      { text: '녕하', decoration: deco(1, 3) },
      { text: '세요', decoration: null },
    ])
  })

  it('맨 앞부터 시작하면 앞 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
      { text: '하세요', decoration: null },
    ])
  })

  it('끝까지 덮으면 뒤 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕', [deco(0, 2)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
    ])
  })

  it('맞닿은 두 범위 사이에는 빈 조각이 없다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2), deco(2, 4)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
      { text: '하세', decoration: deco(2, 4) },
      { text: '요', decoration: null },
    ])
  })

  it('정렬되지 않은 입력도 위치순으로 처리한다', () => {
    expect(splitByDecorations('안녕하세요', [deco(3, 5), deco(0, 1)])).toEqual([
      { text: '안', decoration: deco(0, 1) },
      { text: '녕하', decoration: null },
      { text: '세요', decoration: deco(3, 5) },
    ])
  })

  it('앞 조각과 겹치는 항목은 건너뛴다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 3), deco(2, 5)])).toEqual([
      { text: '안녕하', decoration: deco(0, 3) },
      { text: '세요', decoration: null },
    ])
  })
})
