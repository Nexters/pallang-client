import { describe, expect, it } from 'vitest'

import { clampQuote, joinBlockTexts } from '../_services/ocrText.service'

describe('joinBlockTexts', () => {
  it('빈 배열은 빈 문자열이다', () => {
    expect(joinBlockTexts([])).toBe('')
  })

  it('lineBreak가 false면 공백으로 잇는다', () => {
    expect(
      joinBlockTexts([
        { text: '우리는', lineBreak: false },
        { text: '모두', lineBreak: false },
      ]),
    ).toBe('우리는 모두')
  })

  it('lineBreak가 true면 줄바꿈으로 잇는다', () => {
    expect(
      joinBlockTexts([
        { text: '우리는 모두', lineBreak: true },
        { text: '이야기를 찾아 헤맨다.', lineBreak: false },
      ]),
    ).toBe('우리는 모두\n이야기를 찾아 헤맨다.')
  })

  it('마지막 블록 뒤에는 구분자를 붙이지 않는다', () => {
    expect(joinBlockTexts([{ text: '끝', lineBreak: true }])).toBe('끝')
  })

  it('마지막 블록의 text가 비어 있어도 꼬리 구분자가 남지 않는다', () => {
    expect(
      joinBlockTexts([
        { text: 'A', lineBreak: true },
        { text: '', lineBreak: false },
      ]),
    ).toBe('A')
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
