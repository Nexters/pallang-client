import { describe, expect, it } from 'vitest'

import {
  emptyBookForm,
  isValidBookForm,
  normalizeExternalAuthor,
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

describe('normalizeExternalAuthor', () => {
  // 알라딘은 '한강 (지은이), 김완희 (옮긴이)'처럼 역할 표기를 붙여서 준다.
  it('역할 표기를 뗀다', () => {
    expect(normalizeExternalAuthor('한강 (지은이)')).toBe('한강')
  })

  it('지은이가 있으면 지은이만 남긴다', () => {
    expect(normalizeExternalAuthor('사이토 로쿠로 (지은이), ATLUS (원작), 김완희 (옮긴이)')).toBe(
      '사이토 로쿠로',
    )
  })

  it('지은이가 없으면 글을 쓴 사람을 남긴다', () => {
    expect(normalizeExternalAuthor('멜로우TV (원작), 한바리 (글), 차차 (그림)')).toBe('한바리')
  })

  it('지은이도 글도 없으면 역할만 떼고 모두 남긴다', () => {
    expect(normalizeExternalAuthor('말량 (원작), 박지영 (만화)')).toBe('말량, 박지영')
  })

  it('이름 안의 괄호는 역할로 보지 않는다', () => {
    expect(normalizeExternalAuthor('홍유진 (지은이), 아세움(박교은) (그림)')).toBe('홍유진')
  })

  it('역할 표기가 없으면 그대로 둔다', () => {
    expect(normalizeExternalAuthor('한강')).toBe('한강')
    expect(normalizeExternalAuthor('')).toBe('')
  })
})

describe('toCreateBookInput', () => {
  it('페이지 수를 숫자로 바꾸고 앞뒤 공백을 턴다', () => {
    expect(toCreateBookInput({ ...filled, title: '  채식주의자 ' })).toEqual({
      author: '한강',
      isbn: '9788936434120',
      pageCount: 268,
      publisher: '창비',
      title: '채식주의자',
    })
  })

  it('빈 ISBN은 아예 넣지 않는다', () => {
    // 빈 문자열을 그대로 보내면 서버가 형식 검증에서 400을 낸다.
    const input = toCreateBookInput({ ...filled, isbn: '' })
    expect('isbn' in input).toBe(false)
  })
})
