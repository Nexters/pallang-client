import { describe, expect, it } from 'vitest'

import { findBookDetail, isBookDetailMissing } from '../_services/bookDetail.service'
import type { SelectedBook } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 3,
  title: '싯다르타',
  author: '헤르만 헤세',
  coverImageUrl: null,
  pageCount: 200,
}

describe('isBookDetailMissing', () => {
  it('저자가 비어 있으면 세부가 덜 찬 책이다', () => {
    // 흔적 보기 화면이 넘기는 씨앗만 이 모양이 된다.
    expect(isBookDetailMissing({ ...book, author: '', pageCount: null })).toBe(true)
    expect(isBookDetailMissing({ ...book, author: '   ' })).toBe(true)
  })

  it('저자가 있으면 쪽수를 몰라도 조회하지 않는다', () => {
    // 인기 목록에서 고른 책이 이 모양이다 — 시트에서 고른 책이라 이미 제 세부를 갖췄다고 본다.
    expect(isBookDetailMissing({ ...book, pageCount: null })).toBe(false)
  })

  it('책이 없으면 조회할 것도 없다', () => {
    expect(isBookDetailMissing(null)).toBe(false)
  })
})

describe('findBookDetail', () => {
  it('bookId가 같은 항목을 고른다', () => {
    const found = findBookDetail(
      [
        { bookId: 9, author: '다른 사람', pageCount: 100 },
        { bookId: 3, author: '헤르만 헤세', pageCount: 200 },
      ],
      3,
    )
    expect(found).toEqual({ bookId: 3, author: '헤르만 헤세', pageCount: 200 })
  })

  it('제목이 같아도 bookId가 다르면 고르지 않는다', () => {
    // 같은 제목의 다른 판본이 섞여 온다 — 제목으로 맞추면 남의 쪽수를 가져온다.
    expect(findBookDetail([{ bookId: 9, author: '헤르만 헤세', pageCount: 320 }], 3)).toBeNull()
  })

  it('결과가 비면 null이다', () => {
    expect(findBookDetail([], 3)).toBeNull()
  })
})
