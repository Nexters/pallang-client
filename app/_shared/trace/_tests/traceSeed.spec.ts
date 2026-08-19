import { describe, expect, it } from 'vitest'

import { buildTraceSeedHref, parseTraceSeed } from '../_data/traceSeed.model'

/** 씨앗이 모임 스코프를 실어 나르는지만 본다 — 책·대목·꾸밈 왕복은 흔적 작성 쪽 스펙이 잠근다 */
describe('흔적 작성 씨앗의 모임 스코프', () => {
  it('모임 스코프 groupId를 씨앗에 싣고 읽는다', () => {
    const href = buildTraceSeedHref({
      bookId: 7,
      bookTitle: '책',
      bookCoverImageUrl: null,
      passage: null,
      groupId: 3,
    })

    expect(href).toContain('groupId=3')
    expect(
      parseTraceSeed(Object.fromEntries(new URL(`https://x${href}`).searchParams))?.groupId,
    ).toBe(3)
  })

  it('모임 밖에서 시작한 씨앗은 groupId가 없다 — 링크에도 싣지 않는다', () => {
    const href = buildTraceSeedHref({
      bookId: 7,
      bookTitle: '책',
      bookCoverImageUrl: null,
      passage: null,
      groupId: null,
    })

    expect(href).not.toContain('groupId')
    expect(parseTraceSeed({ bookId: '7', bookTitle: '책' })?.groupId).toBeNull()
  })

  it('양의 정수가 아닌 groupId는 버린다 — URL은 사용자가 고쳐 쓸 수 있는 자리다', () => {
    for (const groupId of ['0', '-3', '1.5', 'abc']) {
      expect(parseTraceSeed({ bookId: '7', bookTitle: '책', groupId })?.groupId).toBeNull()
    }
  })
})
