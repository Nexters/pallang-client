import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { isSeededPassage } from '../_services/seededPassage.service'
import type { TraceDraft } from '../_types/traceDraft.type'

const DECORATION = {
  startOffset: 0,
  endOffset: 2,
  effectType: 'WAVY',
  color: '#06D6A0',
} as const

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

/** 흔적 보기의 '의견 남기기'가 만들어 주는 초안 */
const seeded = draftWith({
  source: 'passage',
  quotedText: '문장',
  pageNumber: 122,
  decorations: [DECORATION],
  passageId: 42,
})

describe('isSeededPassage', () => {
  it('흔적 보기에서 대목을 통째로 물고 온 초안을 가려낸다', () => {
    expect(isSeededPassage(seeded)).toBe(true)
  })

  it('사진·직접 입력으로 얻은 대목은 아니다', () => {
    expect(isSeededPassage(draftWith({ ...seeded, source: 'photo' }))).toBe(false)
    expect(isSeededPassage(draftWith({ ...seeded, source: 'manual' }))).toBe(false)
  })

  it('합칠 대목이 정해졌다는 것만으로는 가를 수 없다', () => {
    // ③의 합치기 다이얼로그에서 '합치기'를 고르고 ①로 되돌아온 초안이 그렇다 —
    // passageId만 보면 씨앗 경로와 구분되지 않아 평소 경로의 ①이 저장 화면으로 바뀌어 버린다.
    const mergedByHand = draftWith({
      source: 'manual',
      quotedText: '문장',
      pageNumber: 122,
      decorations: [DECORATION],
      passageId: 42,
    })
    expect(isSeededPassage(mergedByHand)).toBe(false)
  })

  it('꾸밈이 하나도 없으면 아니다 — 그 상태로는 ①에서 저장할 수 없다', () => {
    // 서버가 꾸밈을 최소 하나 요구한다(createOpinion). URL의 deco를 손으로 지우면 이렇게 된다 —
    // ①을 마지막 화면으로 만들면 저장이 계속 실패하고 꾸밀 길도 없어 갇힌다.
    expect(isSeededPassage(draftWith({ ...seeded, decorations: [] }))).toBe(false)
  })

  it('페이지가 없으면 아니다 — 읽기 전용으로 보여줄 값이 없다', () => {
    expect(isSeededPassage(draftWith({ ...seeded, pageNumber: null }))).toBe(false)
  })
})
