import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { shouldCheckSimilar, similarCheckKey } from '../_services/similarCheck.service'
import type { SelectedBook, TraceDraft } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 7,
  title: '모순',
  author: '양귀자',
  coverImageUrl: null,
  pageCount: null,
}

/** 책과 대목이 갖춰져 물어볼 수 있는 초안 */
function ready(overrides: Partial<TraceDraft> = {}): TraceDraft {
  return { ...initialTraceDraft, book, quotedText: '문장이 오래 남았다', ...overrides }
}

describe('similarCheckKey', () => {
  it('책과 대목이 다 있어야 키가 생긴다', () => {
    expect(similarCheckKey(initialTraceDraft)).toBeNull()
    expect(similarCheckKey({ ...initialTraceDraft, book })).toBeNull()
    expect(similarCheckKey(ready())).toBe('7:문장이 오래 남았다')
  })

  it('페이지는 키에 들어가지 않는다', () => {
    // 물음이 페이지를 받기 전에 나오므로, 페이지를 채우는 순간 키가 달라지면 방금 답한 것을 또 묻는다
    expect(similarCheckKey(ready({ pageNumber: 87 }))).toBe(similarCheckKey(ready()))
  })
})

describe('shouldCheckSimilar', () => {
  it('책과 대목이 갖춰지면 묻는다', () => {
    expect(shouldCheckSimilar(ready())).toBe(true)
  })

  it('책이 없으면 묻지 않는다 — 서버가 bookId를 요구한다', () => {
    expect(shouldCheckSimilar({ ...initialTraceDraft, quotedText: '문장' })).toBe(false)
  })

  it('흔적 보기에서 대목을 물고 들어온 초안은 묻지 않는다', () => {
    expect(shouldCheckSimilar(ready({ source: 'passage' }))).toBe(false)
  })

  it('합칠 대목이 이미 잡혀 있으면 묻지 않는다', () => {
    expect(shouldCheckSimilar(ready({ passageId: 42 }))).toBe(false)
  })

  it('같은 조합을 이미 물었으면 답이 무엇이었든 다시 묻지 않는다', () => {
    const asked = ready({ similarCheckedKey: '7:문장이 오래 남았다' })
    expect(shouldCheckSimilar(asked)).toBe(false)
    // 페이지를 뒤늦게 채워도 마찬가지다
    expect(shouldCheckSimilar({ ...asked, pageNumber: 87 })).toBe(false)
  })

  it('책이 바뀌면 다시 묻는다', () => {
    const asked = ready({ similarCheckedKey: '7:문장이 오래 남았다' })
    expect(shouldCheckSimilar({ ...asked, book: { ...book, bookId: 9 } })).toBe(true)
  })
})
