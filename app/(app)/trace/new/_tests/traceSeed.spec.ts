import { describe, expect, it } from 'vitest'

import { buildTraceSeedHref, parseTraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

describe('buildTraceSeedHref', () => {
  it('책만 쿼리에 싣는다', () => {
    expect(buildTraceSeedHref({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null })).toBe(
      '/trace/new?bookId=11&bookTitle=%EB%AA%A8%EC%88%9C',
    )
  })

  it('표지가 있으면 함께 싣는다', () => {
    expect(
      buildTraceSeedHref({
        bookId: 11,
        bookTitle: '모순',
        bookCoverImageUrl: 'https://img.example/1.jpg',
      }),
    ).toContain('bookCover=https%3A%2F%2Fimg.example%2F1.jpg')
  })
})

describe('parseTraceSeed', () => {
  it('책이 갖춰지면 씨앗이 된다', () => {
    expect(parseTraceSeed({ bookId: '11', bookTitle: '모순' })).toEqual({
      bookId: 11,
      bookTitle: '모순',
      bookCoverImageUrl: null,
    })
  })

  it('책이 없으면 씨앗이 성립하지 않는다', () => {
    expect(parseTraceSeed({ bookTitle: '모순' })).toBeNull()
    expect(parseTraceSeed({})).toBeNull()
  })

  it('대목 쿼리가 남아 있어도 무시한다', () => {
    // 예전 링크가 아직 열려 있을 수 있다. 대목은 이제 항상 새로 입력한다.
    expect(
      parseTraceSeed({ bookId: '11', bookTitle: '모순', quote: '옛 대목', page: '3' }),
    ).toEqual({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null })
  })
})
