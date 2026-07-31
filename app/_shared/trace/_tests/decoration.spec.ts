import { describe, expect, it } from 'vitest'

import type { Decoration } from '../_data/decoration.model'
import { splitByDecorations } from '../_services/decoration.service'

const deco = (startOffset: number, endOffset: number): Decoration => ({
  startOffset,
  endOffset,
  effectType: 'HIGHLIGHT',
  color: '#FFE08A',
})

describe('splitByDecorations', () => {
  it('효과가 없으면 통째로 한 조각이다', () => {
    expect(splitByDecorations('안녕하세요', [])).toEqual([
      { decoration: null, startOffset: 0, text: '안녕하세요' },
    ])
  })

  it('빈 문자열은 빈 배열이다', () => {
    expect(splitByDecorations('', [])).toEqual([])
  })

  it('가운데 범위를 앞·효과·뒤 세 조각으로 나눈다', () => {
    expect(splitByDecorations('안녕하세요', [deco(1, 3)])).toEqual([
      { decoration: null, startOffset: 0, text: '안' },
      { decoration: deco(1, 3), startOffset: 1, text: '녕하' },
      { decoration: null, startOffset: 3, text: '세요' },
    ])
  })

  it('맨 앞부터 시작하면 앞 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2)])).toEqual([
      { decoration: deco(0, 2), startOffset: 0, text: '안녕' },
      { decoration: null, startOffset: 2, text: '하세요' },
    ])
  })

  it('끝까지 덮으면 뒤 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕', [deco(0, 2)])).toEqual([
      { decoration: deco(0, 2), startOffset: 0, text: '안녕' },
    ])
  })

  it('맞닿은 두 범위 사이에는 빈 조각이 없다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2), deco(2, 4)])).toEqual([
      { decoration: deco(0, 2), startOffset: 0, text: '안녕' },
      { decoration: deco(2, 4), startOffset: 2, text: '하세' },
      { decoration: null, startOffset: 4, text: '요' },
    ])
  })

  it('정렬되지 않은 입력도 위치순으로 처리한다', () => {
    expect(splitByDecorations('안녕하세요', [deco(3, 5), deco(0, 1)])).toEqual([
      { decoration: deco(0, 1), startOffset: 0, text: '안' },
      { decoration: null, startOffset: 1, text: '녕하' },
      { decoration: deco(3, 5), startOffset: 3, text: '세요' },
    ])
  })

  it('앞 조각과 겹치는 항목은 건너뛴다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 3), deco(2, 5)])).toEqual([
      { decoration: deco(0, 3), startOffset: 0, text: '안녕하' },
      { decoration: null, startOffset: 3, text: '세요' },
    ])
  })

  // 조회 화면은 서버가 준 오프셋을 그대로 받는다 — 뒤집히거나 빈 범위에 글자가 겹쳐 그려지면 안 된다
  it('뒤집힌 범위는 건너뛰고 글자를 겹쳐 그리지 않는다', () => {
    expect(splitByDecorations('안녕하세요', [deco(5, 2)])).toEqual([
      { decoration: null, startOffset: 0, text: '안녕하세요' },
    ])
  })

  it('길이가 0인 범위는 건너뛴다', () => {
    expect(splitByDecorations('안녕하세요', [deco(2, 2)])).toEqual([
      { decoration: null, startOffset: 0, text: '안녕하세요' },
    ])
  })
})
