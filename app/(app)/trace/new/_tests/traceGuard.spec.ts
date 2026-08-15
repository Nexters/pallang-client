import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { resolveGuardRedirect } from '../_services/traceGuard.service'
import type { TraceDraft } from '../_types/traceDraft.type'

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

const written = draftWith({ quotedText: '문장', pageNumber: 10, content: '좋았다' })
const decorated = draftWith({
  ...written,
  decorations: [{ startOffset: 0, endOffset: 2, effectType: 'HIGHLIGHT', color: '#FFE81A' }],
})

describe('resolveGuardRedirect', () => {
  it('첫 화면은 언제나 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new', initialTraceDraft)).toBeNull()
  })

  it('카메라 단계는 책 없이도 들어갈 수 있다', () => {
    // 책은 이제 마지막에 고른다. 대목을 얻기 전이라 선행 조건이 없다.
    expect(resolveGuardRedirect('/trace/new/photo', initialTraceDraft)).toBeNull()
  })

  it('대목 없이 생각 작성에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/write', initialTraceDraft)).toBe('/trace/new')
  })

  it('대목이 있으면 생각 작성을 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new/write', draftWith({ quotedText: '문장' }))).toBeNull()
  })

  it('페이지나 의견이 비면 꾸미기에서 생각 작성으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/decorate', draftWith({ quotedText: '문장' }))).toBe(
      '/trace/new/write',
    )
    expect(
      resolveGuardRedirect(
        '/trace/new/decorate',
        draftWith({ quotedText: '문장', pageNumber: 10 }),
      ),
    ).toBe('/trace/new/write')
  })

  it('생각 작성을 마치면 꾸미기를 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new/decorate', written)).toBeNull()
  })

  it('꾸밈 없이 책 등록에 들어오면 꾸미기로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/book', written)).toBe('/trace/new/decorate')
  })

  it('꾸밈까지 마치면 책 등록을 통과한다 — 책은 여기서 고른다', () => {
    expect(resolveGuardRedirect('/trace/new/book', decorated)).toBeNull()
  })

  it('저장이 끝났으면 작성 단계로 되돌아갈 수 없다', () => {
    const saved = draftWith({ ...decorated, result: { opinionId: 1, merged: false } })
    expect(resolveGuardRedirect('/trace/new/decorate', saved)).toBe('/trace/new/done')
    expect(resolveGuardRedirect('/trace/new/done', saved)).toBeNull()
    // 첫 화면은 새 흔적을 시작하는 자리라 막지 않는다
    expect(resolveGuardRedirect('/trace/new', saved)).toBeNull()
  })

  it('결과 없이 완료 화면에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/done', initialTraceDraft)).toBe('/trace/new')
  })
})
