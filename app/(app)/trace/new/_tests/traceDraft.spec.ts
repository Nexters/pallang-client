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

  it('fillBookDetail은 비어 있던 저자·쪽수만 채운다', () => {
    const seeded = traceDraftReducer(initialTraceDraft, {
      type: 'selectBook',
      book: { ...book, author: '', pageCount: null },
    })

    const next = traceDraftReducer(seeded, {
      type: 'fillBookDetail',
      bookId: book.bookId,
      author: '한강',
      pageCount: 268,
    })

    expect(next.book).toEqual(book)
  })

  it('fillBookDetail은 씨앗이 정해 준 합칠 대목과 저장 결과를 건드리지 않는다', () => {
    // selectBook으로 채우면 passageId·result가 지워진다 — 씨앗 경로에서는 그게 곧 합칠 대상
    // 소실이라 별도 액션을 둔 이유가 여기 있다.
    const seeded = [
      { type: 'selectBook', book: { ...book, author: '', pageCount: null } } as const,
      { type: 'setMergeTarget', passageId: 42 } as const,
      { type: 'setResult', result: { opinionId: 7, merged: true } } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const next = traceDraftReducer(seeded, {
      type: 'fillBookDetail',
      bookId: book.bookId,
      author: '한강',
      pageCount: 268,
    })

    expect(next.passageId).toBe(42)
    expect(next.result).toEqual({ opinionId: 7, merged: true })
  })

  it('fillBookDetail은 이미 채워진 값을 덮지 않는다', () => {
    const picked = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })

    const next = traceDraftReducer(picked, {
      type: 'fillBookDetail',
      bookId: book.bookId,
      author: '다른 저자',
      pageCount: 999,
    })

    expect(next.book).toEqual(book)
  })

  it('fillBookDetail은 다른 책의 응답이면 상태를 그대로 둔다', () => {
    // 응답이 오는 사이 사용자가 시트에서 책을 바꿀 수 있다 — 늦게 온 값이 새 책을 덮으면 안 된다.
    const picked = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })

    const next = traceDraftReducer(picked, {
      type: 'fillBookDetail',
      bookId: book.bookId + 1,
      author: '엉뚱한 저자',
      pageCount: 1,
    })

    expect(next).toBe(picked)
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

  it('setPageDetail은 병합 대상을 비운다', () => {
    // 페이지가 달라지면 직전 병합 판정은 다른 쪽에 대한 답이다 — 남겨 두면 쪽이 맞지 않는
    // 대목에 흔적이 합쳐진다.
    const merged = [
      { type: 'selectBook', book } as const,
      { type: 'setQuotedText', quotedText: '어떤 문장' } as const,
      { type: 'setPageDetail', pageNumber: 87, isSpoiler: false } as const,
      { type: 'setMergeTarget', passageId: 14 } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const next = traceDraftReducer(merged, {
      type: 'setPageDetail',
      pageNumber: 120,
      isSpoiler: false,
    })

    expect(next.passageId).toBeNull()
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

  it('recolorDecoration은 해당 항목의 색만 바꾼다', () => {
    const applied = [
      { type: 'applyDecoration', decoration: decoration(0, 5) } as const,
      { type: 'applyDecoration', decoration: decoration(10, 15) } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const recolored = traceDraftReducer(applied, {
      type: 'recolorDecoration',
      startOffset: 10,
      color: '#1A66FF',
    })
    expect(recolored.decorations.map((d) => [d.startOffset, d.color])).toEqual([
      [0, decoration(0, 5).color],
      [10, '#1A66FF'],
    ])
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

  it('clearQuote는 책과 입력 방식만 남기고 대목을 비운다', () => {
    const filled = [
      { type: 'selectBook', book } as const,
      { type: 'setSource', source: 'photo' } as const,
      { type: 'setQuotedText', quotedText: '어떤 문장' } as const,
      { type: 'setPageDetail', pageNumber: 87, isSpoiler: true } as const,
      { type: 'applyDecoration', decoration: decoration(0, 5) } as const,
      { type: 'setMergeTarget', passageId: 9 } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const next = traceDraftReducer(filled, { type: 'clearQuote' })

    expect(next.book).toEqual(book)
    expect(next.source).toBe('photo')
    expect(next.quotedText).toBe('')
    expect(next.decorations).toEqual([])
    expect(next.pageNumber).toBeNull()
    expect(next.isSpoiler).toBe(false)
    expect(next.passageId).toBeNull()
  })

  it('clearQuote는 의견 본문을 지우지 않는다', () => {
    // 대목을 다시 고르러 나갔다 돌아오는 흐름이라, 이미 쓴 의견을 날릴 이유가 없다.
    const filled = [
      { type: 'selectBook', book } as const,
      { type: 'setContent', content: '내 의견' } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    expect(traceDraftReducer(filled, { type: 'clearQuote' }).content).toBe('내 의견')
  })

  it('reset은 전부 비운다', () => {
    const filled = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })
    expect(traceDraftReducer(filled, { type: 'reset' })).toEqual(initialTraceDraft)
  })
})
