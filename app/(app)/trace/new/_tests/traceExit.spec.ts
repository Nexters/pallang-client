import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { resolveExitDecision } from '../_services/traceExit.service'
import type { SelectedBook, TraceDraft } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 1,
  title: '채식주의자',
  author: '한강',
  coverImageUrl: null,
  pageCount: 268,
}

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

describe('resolveExitDecision', () => {
  it('오버레이가 열려 있으면 그 층만 닫는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, quotedText: '문장' }),
        hasOverlay: true,
        step: 'detail',
      }),
    ).toBe('closeOverlay')
  })

  it('완료 화면은 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ result: { opinionId: 1, merged: false } }),
        hasOverlay: false,
        step: 'done',
      }),
    ).toBe('exit')
  })

  it('책만 고른 상태는 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({ draft: draftWith({ book }), hasOverlay: false, step: 'search' }),
    ).toBe('exit')
  })

  it('아무것도 고르지 않은 첫 화면은 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({ draft: initialTraceDraft, hasOverlay: false, step: 'search' }),
    ).toBe('exit')
  })

  it('대목을 담았으면 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, quotedText: '문장' }),
        hasOverlay: false,
        step: 'detail',
      }),
    ).toBe('confirm')
  })

  it('효과만 넣었어도 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({
          book,
          decorations: [{ startOffset: 0, endOffset: 2, effectType: 'UNDERLINE', color: '#fff' }],
        }),
        hasOverlay: false,
        step: 'decorate',
      }),
    ).toBe('confirm')
  })

  it('의견만 썼어도 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, content: '내 의견' }),
        hasOverlay: false,
        step: 'opinion',
      }),
    ).toBe('confirm')
  })

  it('저장이 끝난 draft는 어느 단계에서도 확인하지 않는다', () => {
    // guard가 done으로 되돌리는 중간 프레임에서 확인 다이얼로그가 뜨면 안 된다.
    expect(
      resolveExitDecision({
        draft: draftWith({
          book,
          quotedText: '문장',
          content: '내 의견',
          result: { opinionId: 1, merged: false },
        }),
        hasOverlay: false,
        step: 'opinion',
      }),
    ).toBe('exit')
  })

  it('단계를 알 수 없으면 그냥 나간다', () => {
    expect(resolveExitDecision({ draft: initialTraceDraft, hasOverlay: false, step: null })).toBe(
      'exit',
    )
  })
})
