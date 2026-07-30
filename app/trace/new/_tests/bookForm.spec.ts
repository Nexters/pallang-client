import { describe, expect, it } from 'vitest'

import {
  emptyBookForm,
  isValidBookForm,
  toCreateBookInput,
  validateBookForm,
} from '../_services/bookForm.service'

const filled = {
  author: '한강',
  isbn: '9788936434120',
  pageCount: '268',
  publisher: '창비',
  title: '채식주의자',
}

describe('validateBookForm', () => {
  it('빈 폼은 필수 네 항목을 모두 지적한다', () => {
    expect(Object.keys(validateBookForm(emptyBookForm)).sort()).toEqual([
      'author',
      'pageCount',
      'publisher',
      'title',
    ])
  })

  it('공백만 넣은 값은 비어 있는 것으로 본다', () => {
    const errors = validateBookForm({ ...filled, title: '   ' })
    expect(errors.title).toBeTruthy()
  })

  it('ISBN은 비어 있어도 문제 삼지 않는다', () => {
    expect(validateBookForm({ ...filled, isbn: '' })).toEqual({})
  })

  it('페이지 수는 1 이상의 정수만 받는다', () => {
    expect(validateBookForm({ ...filled, pageCount: '0' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '-3' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '12.5' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '쪽수' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '1' })).toEqual({})
  })
})

describe('isValidBookForm', () => {
  it('필수 항목이 모두 채워지면 통과한다', () => {
    expect(isValidBookForm(filled)).toBe(true)
    expect(isValidBookForm(emptyBookForm)).toBe(false)
  })
})

describe('toCreateBookInput', () => {
  it('페이지 수를 숫자로 바꾸고 앞뒤 공백을 턴다', () => {
    expect(toCreateBookInput({ ...filled, title: '  채식주의자 ' }, null)).toEqual({
      author: '한강',
      isbn: '9788936434120',
      pageCount: 268,
      publisher: '창비',
      title: '채식주의자',
    })
  })

  it('빈 ISBN과 커버는 아예 넣지 않는다', () => {
    // 빈 문자열을 그대로 보내면 서버가 형식 검증에서 400을 낸다.
    const input = toCreateBookInput({ ...filled, isbn: '' }, null)
    expect('isbn' in input).toBe(false)
    expect('coverImageUrl' in input).toBe(false)
  })

  it('커버 URL이 있으면 함께 보낸다', () => {
    expect(toCreateBookInput(filled, 'https://image.aladin.co.kr/cover.jpg').coverImageUrl).toBe(
      'https://image.aladin.co.kr/cover.jpg',
    )
  })
})
