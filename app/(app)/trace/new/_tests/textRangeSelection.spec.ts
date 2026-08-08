import { describe, expect, it } from 'vitest'

import { normalizeRange } from '../_services/textRange.service'

describe('normalizeRange', () => {
  it('앞에서 뒤로 드래그하면 endOffset이 exclusive가 된다', () => {
    expect(normalizeRange(1, 3)).toEqual({ startOffset: 1, endOffset: 4 })
  })

  it('뒤에서 앞으로 드래그해도 같은 범위가 된다', () => {
    expect(normalizeRange(3, 1)).toEqual({ startOffset: 1, endOffset: 4 })
  })

  it('한 글자만 눌러도 길이 1인 범위가 된다', () => {
    expect(normalizeRange(2, 2)).toEqual({ startOffset: 2, endOffset: 3 })
  })
})
