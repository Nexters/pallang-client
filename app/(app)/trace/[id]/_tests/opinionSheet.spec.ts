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
function resync(state: OpinionSheetModel, deepLinkOpinionId: number | null = null) {
  return opinionSheetReducer(state, {
    type: 'sync',
    passageId: state.passageId,
    isMasked: state.isMasked,
    deepLinkOpinionId,
  })
}

describe('답글 시트 여닫기', () => {
  it('처음에는 닫혀 있다', () => {
    expect(createOpinionSheetModel({ passageId: PASSAGE_ID, isMasked: false })).toMatchObject({
      replyOpinionId: null,
    })
  })

  it('openReply는 그 의견의 답글 시트를 올린다', () => {
    expect(opinionSheetReducer(model(), { type: 'openReply', opinionId: 3 })).toMatchObject({
      replyOpinionId: 3,
    })
  })

  it('다른 의견의 댓글을 누르면 그 의견으로 갈아탄다 — 한 번에 하나만 떠 있다', () => {
    const opened = opinionSheetReducer(model(), { type: 'openReply', opinionId: 1 })
    expect(opinionSheetReducer(opened, { type: 'openReply', opinionId: 2 })).toMatchObject({
      replyOpinionId: 2,
    })
  })

  it('같은 의견을 다시 열어도 상태가 바뀌지 않는다 — 시트가 다시 올라오지 않게', () => {
    const opened = opinionSheetReducer(model(), { type: 'openReply', opinionId: 1 })
    expect(opinionSheetReducer(opened, { type: 'openReply', opinionId: 1 })).toBe(opened)
  })

  it('closeReply는 시트를 내린다', () => {
    const opened = model({ replyOpinionId: 3 })
    expect(opinionSheetReducer(opened, { type: 'closeReply' }).replyOpinionId).toBeNull()
  })

  it('닫힌 시트를 또 닫아도 상태가 바뀌지 않는다', () => {
    const closed = model()
    expect(opinionSheetReducer(closed, { type: 'closeReply' })).toBe(closed)
  })
})

describe('대목이 바뀌면 리셋한다(#128)', () => {
  it('답글 시트가 닫힌다 — 보이지도 않는 이전 대목의 의견에 답글이 달리지 않게', () => {
    const busy = model({ replyOpinionId: 3 })

    const next = opinionSheetReducer(busy, {
      type: 'sync',
      passageId: 91,
      isMasked: false,
      deepLinkOpinionId: null,
    })

    expect(next).toMatchObject({ replyOpinionId: null, passageId: 91 })
  })

  it('대목이 그대로면 열어 둔 것을 건드리지 않는다', () => {
    const busy = model({ replyOpinionId: 3 })
    expect(resync(busy)).toBe(busy)
  })

  it('아직 대목이 도착하지 않은 상태(undefined)에서 도착해도 리셋이 돈다', () => {
    const pending = model({ passageId: undefined })

    const next = opinionSheetReducer(pending, {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: false,
      deepLinkOpinionId: null,
    })

    expect(next.passageId).toBe(PASSAGE_ID)
  })
})

describe('가림막이 다시 씌워지면 리셋한다(#49)', () => {
  it('대목이 그대로여도 답글 시트가 닫힌다', () => {
    const busy = model({ replyOpinionId: 3 })

    const next = opinionSheetReducer(busy, {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: true,
      deepLinkOpinionId: null,
    })

    expect(next).toMatchObject({ replyOpinionId: null, isMasked: true })
  })

  it('닫힌 채로 가려지면 가림막만 기록하고 상태는 그대로다', () => {
    const next = opinionSheetReducer(model(), {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: true,
      deepLinkOpinionId: null,
    })

    expect(next).toMatchObject({ replyOpinionId: null, isMasked: true })
    // 한 번 기록하고 나면 같은 sync는 더 이상 상태를 바꾸지 않는다 — 렌더 도중 호출이라 멎어야 한다
    expect(resync(next)).toBe(next)
  })
})

describe('가려진 대목에서는 아무것도 열 수 없다(#49)', () => {
  const masked = model({ isMasked: true })

  it('답글 시트가 올라오지 않는다 — 블러는 그림일 뿐이다', () => {
    expect(opinionSheetReducer(masked, { type: 'openReply', opinionId: 3 })).toBe(masked)
  })

  it('닫는 길은 막지 않는다 — 막으면 열린 채로 갇힌다', () => {
    const trapped = model({ isMasked: true, replyOpinionId: 3 })

    expect(opinionSheetReducer(trapped, { type: 'closeReply' }).replyOpinionId).toBeNull()
  })
})

describe('딥링크가 지목한 흔적은 답글 시트로 연다', () => {
  it('목록에서 찾아낸 순간 그 의견의 답글 시트가 올라온다', () => {
    expect(resync(model(), 3).replyOpinionId).toBe(3)
  })

  it('한 번 열고 나면 다른 의견으로 옮겨가도 딥링크가 다시 끌어오지 않는다', () => {
    const opened = resync(model(), 3)
    const moved = opinionSheetReducer(opened, { type: 'openReply', opinionId: 7 })

    // 지목은 그대로 남아 있지만(시트를 닫기 전) 이미 반영했으므로 건드리지 않는다
    expect(resync(moved, 3).replyOpinionId).toBe(7)
  })

  it('닫아서 지목이 풀리면 시트도 닫힌 채로 남는다', () => {
    const opened = resync(model(), 3)
    const closed = opinionSheetReducer(opened, { type: 'closeReply' })

    // 시트를 닫을 때 지목도 함께 놓아주므로(TraceListPanel) 다음 sync는 null로 들어온다
    expect(resync(closed, null).replyOpinionId).toBeNull()
  })

  it('가려져 있으면 열지 않고, 가림막이 풀리면 그제야 연다(#49)', () => {
    const masked = opinionSheetReducer(model({ isMasked: true }), {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: true,
      deepLinkOpinionId: 3,
    })
    expect(masked.replyOpinionId).toBeNull()

    const revealed = opinionSheetReducer(masked, {
      type: 'sync',
      passageId: PASSAGE_ID,
      isMasked: false,
      deepLinkOpinionId: 3,
    })
    expect(revealed.replyOpinionId).toBe(3)
  })
})
