import { describe, expect, it } from 'vitest'

import { toSearchParamsRecord } from '@/app/_global/_services/searchParams.service'

describe('toSearchParamsRecord', () => {
  it('한 번 온 키는 문자열로 준다', () => {
    expect(toSearchParamsRecord(new URLSearchParams('bookId=7&bookTitle=파도'))).toEqual({
      bookId: '7',
      bookTitle: '파도',
    })
  })

  it('같은 키가 여러 번 오면 서버 searchParams와 같게 배열이 된다', () => {
    expect(toSearchParamsRecord(new URLSearchParams('tag=1&tag=2&bookId=7'))).toEqual({
      tag: ['1', '2'],
      bookId: '7',
    })
  })

  it('빈 쿼리는 빈 객체가 된다', () => {
    expect(toSearchParamsRecord(new URLSearchParams(''))).toEqual({})
  })
})
