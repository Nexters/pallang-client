import { describe, expect, it } from 'vitest'

import {
  buildTraceSeedHref,
  parseTraceSeed,
  type TraceSeed,
} from '@/app/_shared/trace/_data/traceSeed.model'

/** 링크로 나갔다가 쿼리로 돌아오는 왕복을 그대로 흉내낸다 */
function roundTrip(seed: TraceSeed): TraceSeed | null {
  const url = new URL(buildTraceSeedHref(seed), 'http://localhost')
  return parseTraceSeed(Object.fromEntries(url.searchParams))
}

const BOOK: TraceSeed = {
  bookId: 11,
  bookTitle: '모순',
  bookCoverImageUrl: 'https://example.com/cover.jpg',
  passage: null,
}

describe('흔적 작성 씨앗', () => {
  it('책만 담긴 씨앗이 왕복해도 그대로다', () => {
    expect(roundTrip(BOOK)).toEqual(BOOK)
  })

  it('대목까지 담긴 씨앗이 왕복해도 그대로다', () => {
    const seed: TraceSeed = {
      ...BOOK,
      passage: {
        passageId: 14,
        pageNumber: 178,
        // 공백·따옴표·개행이 섞인 인용문도 원문 그대로 돌아와야 한다
        quotedText: '가장 어두운 순간에도, 어딘가에는 "빛"이 있다.',
        isSpoiler: true,
      },
    }

    expect(roundTrip(seed)).toEqual(seed)
  })

  it('책이 없으면 씨앗으로 인정하지 않는다', () => {
    expect(parseTraceSeed({})).toBeNull()
    expect(parseTraceSeed({ bookTitle: '모순' })).toBeNull()
    expect(parseTraceSeed({ bookId: '11' })).toBeNull()
  })

  it('책 식별자가 양의 정수가 아니면 버린다', () => {
    for (const bookId of ['0', '-3', '1.5', 'abc', '1e2']) {
      expect(parseTraceSeed({ bookId, bookTitle: '모순' })).toBeNull()
    }
  })

  it('대목 정보가 덜 갖춰지면 책만 남기고 대목은 버린다', () => {
    // passageId만 있고 페이지·인용문이 없으면 붙일 대목을 특정할 수 없다
    const seed = parseTraceSeed({ bookId: '11', bookTitle: '모순', passageId: '14' })

    expect(seed?.bookId).toBe(11)
    expect(seed?.passage).toBeNull()
  })

  it('스포일러 표기가 없으면 가리지 않는다', () => {
    const seed = parseTraceSeed({
      bookId: '11',
      bookTitle: '모순',
      passageId: '14',
      page: '178',
      quote: '인용문',
    })

    expect(seed?.passage?.isSpoiler).toBe(false)
  })
})
