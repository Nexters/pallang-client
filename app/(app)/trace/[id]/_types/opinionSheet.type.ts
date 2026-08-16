/** 의견 바텀시트 화면 — null이면 닫힘, opinionId가 null이면 의견 목록, 있으면 그 의견의 답글 화면 */
export type OpinionSheetState = { opinionId: number | null } | null

/**
 * 의견 시트 흐름의 상태 전부.
 *
 * 시트와 펼친 댓글은 보고 있는 대목(passageId)과 가림막(isMasked)에 매여 있다 —
 * 대목이 바뀌거나 가림막이 다시 씌워지면 둘 다 닫혀야 한다. 넷을 나눠 들면
 * 그 규칙을 여러 곳에서 따로 집행하게 되므로 한 상태로 묶어 리듀서 하나에 맡긴다.
 */
export type OpinionSheetModel = {
  sheet: OpinionSheetState
  /** 흔적 목록에서 댓글이 펼쳐진 의견 — 한 번에 하나만 편다(디자인 202:3978) */
  expandedOpinionId: number | null
  /** 마지막으로 반영한 대목 — 이 값이 바뀌면 목록이 통째로 갈린다 */
  passageId: number | undefined
  /** 마지막으로 반영한 가림막 상태 */
  isMasked: boolean
}

export type OpinionSheetAction =
  /** 렌더마다 현재 대목·가림막을 흘려 넣어 상태를 맞춘다 */
  | { type: 'sync'; passageId: number | undefined; isMasked: boolean }
  /** "N개의 의견" — 의견 목록 화면으로 시트를 연다 */
  | { type: 'openSheet' }
  /** 시트 안에서 그 의견의 답글 화면으로 들어간다 */
  | { type: 'selectOpinion'; opinionId: number }
  /** 답글 화면에서 의견 목록 화면으로 되돌아간다 */
  | { type: 'showList' }
  | { type: 'closeSheet' }
  /** 흔적 목록에서 그 의견의 댓글을 제자리에 여닫는다 */
  | { type: 'toggleComments'; opinionId: number }
