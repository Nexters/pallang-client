import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { resolveGuardRedirect } from '../_services/traceGuard.service'
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

describe('resolveGuardRedirect', () => {
  it('책 선택 화면은 언제나 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new', initialTraceDraft)).toBeNull()
  })

  it('책 없이 photo에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/photo', initialTraceDraft)).toBe('/trace/new')
  })

  it('대목 없이 detail에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/detail', draftWith({ book }))).toBe('/trace/new')
  })

  it('대목이 있으면 detail을 통과한다', () => {
    expect(
      resolveGuardRedirect('/trace/new/detail', draftWith({ book, quotedText: '문장' })),
    ).toBeNull()
  })

  it('페이지 없이 decorate에 들어오면 detail로 되돌린다', () => {
    expect(
      resolveGuardRedirect('/trace/new/decorate', draftWith({ book, quotedText: '문장' })),
    ).toBe('/trace/new/detail')
  })

  it('효과 없이 opinion에 들어오면 decorate로 되돌린다', () => {
    expect(
      resolveGuardRedirect(
        '/trace/new/opinion',
        draftWith({ book, quotedText: '문장', pageNumber: 87 }),
      ),
    ).toBe('/trace/new/decorate')
  })

  it('결과 없이 done에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/done', draftWith({ book }))).toBe('/trace/new')
  })

  it('결과가 있으면 done을 통과한다', () => {
    expect(
      resolveGuardRedirect(
        '/trace/new/done',
        draftWith({ result: { opinionId: 1, merged: false } }),
      ),
    ).toBeNull()
  })
})
