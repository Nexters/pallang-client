import { describe, expect, it } from 'vitest'

import {
  countWithinLimit,
  joinBlockTexts,
  type OcrBlock,
  type OcrBreakType,
} from '../_services/ocrText.service'

const b = (text: string, breakType: OcrBreakType = 'NONE', indented = false): OcrBlock => ({
  text,
  breakType,
  indented,
})

describe('joinBlockTexts', () => {
  it('빈 배열은 빈 문자열이다', () => {
    expect(joinBlockTexts([])).toBe('')
  })

  it('줄 중간 어절은 공백으로 잇는다', () => {
    expect(joinBlockTexts([b('우리는'), b('모두')])).toBe('우리는 모두')
  })

  it('지면 폭 때문에 꺾인 줄(WRAP)은 줄바꿈 없이 한 문단으로 잇는다', () => {
    expect(joinBlockTexts([b('우리는 모두', 'WRAP'), b('이야기를 찾아 헤맨다.')])).toBe(
      '우리는 모두 이야기를 찾아 헤맨다.',
    )
  })

  it('시: 행(LINE)은 줄바꿈, 연(BLANK_LINE)은 빈 줄로 옮긴다', () => {
    expect(
      joinBlockTexts([
        b('내', 'NONE'),
        b('옆에서', 'LINE'),
        b('내', 'NONE'),
        b('뒤에서', 'BLANK_LINE'),
        b('끝'),
      ]),
    ).toBe('내 옆에서\n내 뒤에서\n\n끝')
  })

  it('산문: 문단 끝(PARAGRAPH)은 줄바꿈, 들여쓴 첫 어절 앞에는 전각 공백을 붙인다', () => {
    expect(
      joinBlockTexts([
        b('디드로의', 'NONE', true),
        b('행동이다.', 'PARAGRAPH'),
        b('이런', 'NONE', true),
        b('광경은'),
      ]),
    ).toBe('　디드로의 행동이다.\n　이런 광경은')
  })

  it('마지막 블록 뒤에는 구분자를 붙이지 않는다', () => {
    expect(joinBlockTexts([b('끝', 'BLANK_LINE')])).toBe('끝')
  })

  it('빈 텍스트 블록이 껴도 공백이 겹치지 않는다', () => {
    expect(joinBlockTexts([b('A'), b(''), b('B')])).toBe('A B')
  })
})

describe('countWithinLimit', () => {
  it('다 담기면 블록 수를 그대로 돌려준다', () => {
    expect(countWithinLimit([b('우리는'), b('모두')], 150)).toBe(2)
  })

  it('블록을 잇는 공백까지 길이에 센다', () => {
    // 'AB CD' = 5자라 상한 5에는 딱 맞고, 4에는 두 번째가 못 들어간다
    expect(countWithinLimit([b('AB'), b('CD')], 5)).toBe(2)
    expect(countWithinLimit([b('AB'), b('CD')], 4)).toBe(1)
  })

  it('빈 줄 구분자와 들여쓰기도 길이에 센다', () => {
    // 'AB' + '\n\n' + '　' + 'CD' = 7자
    expect(countWithinLimit([b('AB', 'BLANK_LINE'), b('CD', 'NONE', true)], 7)).toBe(2)
    expect(countWithinLimit([b('AB', 'BLANK_LINE'), b('CD', 'NONE', true)], 6)).toBe(1)
  })

  it('상한을 넘기는 블록 앞에서 끊는다 — 어절 중간을 자르지 않는다', () => {
    expect(countWithinLimit([b('가나다'), b('라마바'), b('사아자')], 8)).toBe(2)
  })

  it('첫 블록부터 상한을 넘으면 하나도 담지 않는다', () => {
    expect(countWithinLimit([b('가나다라')], 3)).toBe(0)
  })

  it('빈 텍스트 블록은 길이를 늘리지 않는다', () => {
    // joinBlockTexts가 빈 블록을 걸러 'A B'를 만드는 것과 같은 계산이어야 한다
    expect(countWithinLimit([b('A'), b(''), b('B')], 3)).toBe(3)
  })

  it('빈 배열은 0이다', () => {
    expect(countWithinLimit([], 150)).toBe(0)
  })
})
