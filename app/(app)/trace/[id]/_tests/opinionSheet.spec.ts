import { describe, expect, it } from 'vitest'

import { createOpinionSheetModel, opinionSheetReducer } from '../_services/opinionSheet.service'
import type { OpinionSheetModel } from '../_types/opinionSheet.type'

const PASSAGE_ID = 71

function model(overrides: Partial<OpinionSheetModel> = {}): OpinionSheetModel {
  return {
    ...createOpinionSheetModel({ passageId: PASSAGE_ID, isMasked: false }),
    ...overrides,
  }
}

/** 대목·가림막은 그대로 둔 채 현재 상태를 다시 맞춘다 — 렌더마다 일어나는 일 */
function resync(state: OpinionSheetModel): OpinionSheetModel {
  return opinionSheetReducer(state, {
    type: 'sync',
    passageId: state.passageId,
    isMasked: state.isMasked,
  })
}

describe('의견 시트 여닫기', () => {
  it('처음에는 닫혀 있고 펼친 댓글도 없다', () => {
    expect(createOpinionSheetModel({ passageId: PASSAGE_ID, isMasked: false })).toMatchObject({
      sheet: null,
      expandedOpinionId: null,
    })
  })

  it('openSheet은 의견 목록 화면으로 연다', () => {
    expect(opinionSheetReducer(model(), { type: 'openSheet' }).sheet).toEqual({ opinionId: null })
  })

  it('selectOpinion은 그 의견의 답글 화면으로 들어간다', () => {
    const opened = opinionSheetReducer(model(), { type: 'openSheet' })
    expect(opinionSheetReducer(opened, { type: 'selectOpinion', opinionId: 3 }).sheet).toEqual({
      opinionId: 3,
    })
  })

  it('showList는 답글 화면에서 의견 목록으로 한 칸만 되돌아간다', () => {
    const reply = model({ sheet: { opinionId: 3 } })
    expect(opinionSheetReducer(reply, { type: 'showList' }).sheet).toEqual({ opinionId: null })
  })

  it('showList는 닫힌 시트를 되살리지 않는다', () => {
    const closed = model()
    expect(opinionSheetReducer(closed, { type: 'showList' })).toBe(closed)
  })

  it('closeSheet은 시트를 닫는다', () => {
    const reply = model({ sheet: { opinionId: 3 } })
    expect(opinionSheetReducer(reply, { type: 'closeSheet' }).sheet).toBeNull()
  })
})

describe('흔적 목록의 댓글 펼침', () => {
  it('toggleComments는 그 의견의 댓글을 편다', () => {
    expect(opinionSheetReducer(model(), { type: 'toggleComments', opinionId: 1 })).toMatchObject({
      expandedOpinionId: 1,
    })
  })

  it('같은 의견을 다시 누르면 접힌다', () => {
    const opened = opinionSheetReducer(model(), { type: 'toggleComments', opinionId: 1 })
    expect(opinionSheetReducer(opened, { type: 'toggleComments', opinionId: 1 })).toMatchObject({
      expandedOpinionId: null,
    })
  })

  it('다른 의견을 누르면 한 번에 하나만 펼쳐진 채로 갈아탄다', () => {
    const opened = opinionSheetReducer(model(), { type: 'toggleComments', opinionId: 1 })
    expect(opinionSheetReducer(opened, { type: 'toggleComments', opinionId: 2 })).toMatchObject({
      expandedOpinionId: 2,
    })
  })
})

describe('대목이 바뀌면 리셋한다(#128)', () => {
  it('시트와 펼친 댓글이 함께 닫힌다 — 보이지도 않는 이전 대목의 의견에 답글이 달리지 않게', () => {
    const busy = model({ sheet: { opinionId: 3 }, expandedOpinionId: 1 })

    const next = opinionSheetReducer(busy, { type: 'sync', passageId: 91, isMasked: false })

    expect(next).toMatchObject({ sheet: null, expandedOpinionId: null, passageId: 91 })
  })

  it('대목이 그대로면 열어 둔 것을 건드리지 않는다', () => {
    const busy = model({ sheet: { opinionId: 3 }, expandedOpinionId: 1 })
    expect(resync(busy)).toBe(busy)
  })

  it('아직 대목이 도착하지 않은 상태(undefined)에서 도착해도 리셋이 돈다', () => {
    const pending = model({ passageId: undefined })

    const next = opinionSheetReducer(pending, {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: false,
    })

    expect(next.passageId).toBe(PASSAGE_ID)
  })
})

describe('가림막이 다시 씌워지면 리셋한다(#49)', () => {
  it('대목이 그대로여도 시트와 펼친 댓글이 함께 닫힌다', () => {
    const busy = model({ sheet: { opinionId: 3 }, expandedOpinionId: 1 })

    const next = opinionSheetReducer(busy, {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: true,
    })

    expect(next).toMatchObject({ sheet: null, expandedOpinionId: null, isMasked: true })
  })

  it('닫힌 채로 가려지면 가림막만 기록하고 상태는 그대로다', () => {
    const next = opinionSheetReducer(model(), {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: true,
    })

    expect(next).toMatchObject({ sheet: null, expandedOpinionId: null, isMasked: true })
    // 한 번 기록하고 나면 같은 sync는 더 이상 상태를 바꾸지 않는다 — 렌더 도중 호출이라 멎어야 한다
    expect(resync(next)).toBe(next)
  })
})

describe('가려진 대목에서는 아무것도 열 수 없다(#49)', () => {
  const masked = model({ isMasked: true })

  it('의견 시트가 열리지 않는다', () => {
    expect(opinionSheetReducer(masked, { type: 'openSheet' })).toBe(masked)
  })

  it('답글 화면으로 들어갈 수 없다', () => {
    expect(opinionSheetReducer(masked, { type: 'selectOpinion', opinionId: 3 })).toBe(masked)
  })

  it('흔적의 댓글도 펼쳐지지 않는다 — 블러는 그림일 뿐이다', () => {
    expect(opinionSheetReducer(masked, { type: 'toggleComments', opinionId: 1 })).toBe(masked)
  })

  it('닫는 길은 막지 않는다 — 막으면 열린 채로 갇힌다', () => {
    const trapped = model({ isMasked: true, sheet: { opinionId: 3 } })

    expect(opinionSheetReducer(trapped, { type: 'showList' }).sheet).toEqual({ opinionId: null })
    expect(opinionSheetReducer(trapped, { type: 'closeSheet' }).sheet).toBeNull()
  })
})
