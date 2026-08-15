import { describe, expect, it } from 'vitest'

import { countWithinLimit, joinBlockTexts } from '../_services/ocrText.service'

describe('joinBlockTexts', () => {
  it('빈 배열은 빈 문자열이다', () => {
    expect(joinBlockTexts([])).toBe('')
  })

  it('블록을 공백으로 잇는다', () => {
    expect(joinBlockTexts([{ text: '우리는' }, { text: '모두' }])).toBe('우리는 모두')
  })

  it('인쇄된 줄이 바뀌어도 줄바꿈 없이 한 문단으로 잇는다', () => {
    // 책 판형 때문에 생긴 줄나눔이라 발췌문에 옮기지 않는다
    expect(joinBlockTexts([{ text: '우리는 모두' }, { text: '이야기를 찾아 헤맨다.' }])).toBe(
      '우리는 모두 이야기를 찾아 헤맨다.',
    )
  })

  it('마지막 블록 뒤에는 구분자를 붙이지 않는다', () => {
    expect(joinBlockTexts([{ text: '끝' }])).toBe('끝')
  })

  it('빈 텍스트 블록이 껴도 공백이 겹치지 않는다', () => {
    expect(joinBlockTexts([{ text: 'A' }, { text: '' }, { text: 'B' }])).toBe('A B')
  })
})

describe('countWithinLimit', () => {
  it('다 담기면 블록 수를 그대로 돌려준다', () => {
    expect(countWithinLimit([{ text: '우리는' }, { text: '모두' }], 150)).toBe(2)
  })

  it('블록을 잇는 공백까지 길이에 센다', () => {
    // 'AB CD' = 5자라 상한 5에는 딱 맞고, 4에는 두 번째가 못 들어간다
    expect(countWithinLimit([{ text: 'AB' }, { text: 'CD' }], 5)).toBe(2)
    expect(countWithinLimit([{ text: 'AB' }, { text: 'CD' }], 4)).toBe(1)
  })

  it('상한을 넘기는 블록 앞에서 끊는다 — 어절 중간을 자르지 않는다', () => {
    expect(countWithinLimit([{ text: '가나다' }, { text: '라마바' }, { text: '사아자' }], 8)).toBe(
      2,
    )
  })

  it('첫 블록부터 상한을 넘으면 하나도 담지 않는다', () => {
    expect(countWithinLimit([{ text: '가나다라' }], 3)).toBe(0)
  })

  it('빈 텍스트 블록은 길이를 늘리지 않는다', () => {
    // joinBlockTexts가 빈 블록을 걸러 'A B'를 만드는 것과 같은 계산이어야 한다
    expect(countWithinLimit([{ text: 'A' }, { text: '' }, { text: 'B' }], 3)).toBe(3)
  })

  it('빈 배열은 0이다', () => {
    expect(countWithinLimit([], 150)).toBe(0)
  })
})
