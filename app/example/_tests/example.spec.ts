import { describe, expect, it } from 'vitest'
import { formatExample } from '../_services/formatExample.service'

describe('formatExample', () => {
  it('라벨 앞에 example: 를 붙인다', () => {
    expect(formatExample('hi')).toBe('example: hi')
  })
})
