import { describe, expect, it } from 'vitest'

import { clampQuote, joinBlockTexts } from '../_services/ocrText.service'

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

describe('clampQuote', () => {
  it('한도 이하면 그대로 둔다', () => {
    expect(clampQuote('12345', 10)).toBe('12345')
  })

  it('한도를 넘으면 잘라낸다', () => {
    expect(clampQuote('1234567890', 5)).toBe('12345')
  })
})
