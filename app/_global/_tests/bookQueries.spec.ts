// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { SearchInternalBooksSort } from '../_apis/_generated/models/searchInternalBooksSort'
import { bookQueries } from '../_queries/book.queries'

describe('bookQueries.searchInternal', () => {
  it('기본 정렬로 의견 많은 순을 요청한다', () => {
    const options = bookQueries.searchInternal({ keyword: '프랑켄슈타인', size: 20 })

    expect(options.queryKey).toEqual([
      'book',
      'internal-search',
      { keyword: '프랑켄슈타인', size: 20, sort: SearchInternalBooksSort.OPINION },
    ])
  })

  it('호출자가 넘긴 정렬이 기본값보다 우선한다', () => {
    const options = bookQueries.searchInternal({
      keyword: '프랑켄슈타인',
      size: 20,
      sort: SearchInternalBooksSort.RECENT,
    })

    expect(options.queryKey).toEqual([
      'book',
      'internal-search',
      { keyword: '프랑켄슈타인', size: 20, sort: SearchInternalBooksSort.RECENT },
    ])
  })
})

describe('bookQueries.recentSearch', () => {
  it('최근 남긴 도서 검색 키워드를 쿼리 키에 포함한다', () => {
    const options = bookQueries.recentSearch({ keyword: '프랑켄슈타인', size: 20 })

    expect(options.queryKey).toEqual([
      'book',
      'recent-search',
      { keyword: '프랑켄슈타인', size: 20 },
    ])
  })
})
