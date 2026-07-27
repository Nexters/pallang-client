import { describe, expect, it } from 'vitest'

import { initialTraceDraft, traceDraftReducer } from '../_data/traceDraft.store'
import type { DraftDecoration, SelectedBook } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 1,
  title: '채식주의자',
  author: '한강',
  coverImageUrl: null,
  pageCount: 268,
}

const decoration = (startOffset: number, endOffset: number): DraftDecoration => ({
  startOffset,
  endOffset,
  effectType: 'HIGHLIGHT',
  color: '#FFE08A',
})

describe('traceDraftReducer', () => {
  it('selectBook은 책을 담는다', () => {
    const next = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })
    expect(next.book).toEqual(book)
  })

  it('setPageDetail은 페이지와 스포일러를 함께 담는다', () => {
    const next = traceDraftReducer(initialTraceDraft, {
      type: 'setPageDetail',
      pageNumber: 87,
      isSpoiler: true,
    })
    expect(next.pageNumber).toBe(87)
    expect(next.isSpoiler).toBe(true)
  })

  it('applyDecoration은 겹치지 않는 범위를 그대로 추가한다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(10, 15),
    })
    expect(withSecond.decorations).toHaveLength(2)
  })

  it('applyDecoration은 겹치는 기존 범위를 교체한다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 10),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(5, 15),
    })
    expect(withSecond.decorations).toEqual([decoration(5, 15)])
  })

  it('경계가 맞닿은 범위는 겹침이 아니다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(5, 10),
    })
    expect(withSecond.decorations).toHaveLength(2)
  })

  it('applyDecoration은 startOffset 오름차순을 유지한다', () => {
    const withLater = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(10, 15),
    })
    const withEarlier = traceDraftReducer(withLater, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    expect(withEarlier.decorations.map((d) => d.startOffset)).toEqual([0, 10])
  })

  it('removeDecoration은 startOffset이 일치하는 항목을 지운다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const removed = traceDraftReducer(withFirst, { type: 'removeDecoration', startOffset: 0 })
    expect(removed.decorations).toEqual([])
  })

  it('resetKeepingBook은 책만 남기고 나머지를 비운다', () => {
    const filled = [
      { type: 'selectBook', book } as const,
      { type: 'setQuotedText', quotedText: '어떤 문장' } as const,
      { type: 'setContent', content: '내 의견' } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const next = traceDraftReducer(filled, { type: 'resetKeepingBook' })
    expect(next.book).toEqual(book)
    expect(next.quotedText).toBe('')
    expect(next.content).toBe('')
    expect(next.result).toBeNull()
  })

  it('reset은 전부 비운다', () => {
    const filled = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })
    expect(traceDraftReducer(filled, { type: 'reset' })).toEqual(initialTraceDraft)
  })
})
