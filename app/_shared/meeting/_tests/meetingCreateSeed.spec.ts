import { describe, expect, it } from 'vitest'

import { buildMeetingCreateHref, parseMeetingCreateBookId } from '../_data/meetingCreateSeed.model'

describe('모임 만들기로 넘기는 책', () => {
  it('만든 링크를 읽으면 같은 책이 나온다', () => {
    const href = buildMeetingCreateHref(44)
    const params = Object.fromEntries(new URL(href, 'https://pallang.test').searchParams)

    expect(href.startsWith('/meeting/new?')).toBe(true)
    expect(parseMeetingCreateBookId(params)).toBe(44)
  })

  it('책이 없거나 양의 정수가 아니면 빈 폼으로 연다', () => {
    expect(parseMeetingCreateBookId({})).toBeNull()
    expect(parseMeetingCreateBookId({ bookId: 'abc' })).toBeNull()
    expect(parseMeetingCreateBookId({ bookId: '-3' })).toBeNull()
  })
})
