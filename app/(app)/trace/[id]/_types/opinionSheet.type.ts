/**
 * 답글 시트 흐름의 상태 전부.
 *
 * 의견 목록은 화면에 늘 붙어 있는 시트(useTraceSheet)가 맡고, 여기서 다루는 것은
 * 그 위로 겹쳐 올라오는 답글 시트뿐이다. 답글 시트는 보고 있는 대목(passageId)과
 * 가림막(isMasked)에 매여 있다 — 대목이 바뀌거나 가림막이 다시 씌워지면 닫혀야 한다.
 * 딥링크가 지목한 흔적을 여는 것도 같은 규칙 아래 있어야 해서 함께 둔다.
 */
export type OpinionSheetModel = {
  /** 답글 시트가 올라와 있는 의견 — null이면 닫힘 */
  replyOpinionId: number | null
  /**
   * 딥링크로 이미 열어 준 의견. 한 번만 여는 데 쓴다 —
   * 기억하지 않으면 사용자가 다른 의견의 답글로 옮겨가도 딥링크가 매 렌더 다시 끌어온다.
   */
  appliedDeepLinkOpinionId: number | null
  /** 마지막으로 반영한 대목 — 이 값이 바뀌면 목록이 통째로 갈린다 */
  passageId: number | undefined
  /** 마지막으로 반영한 가림막 상태 */
  isMasked: boolean
}

export type OpinionSheetAction =
  /** 렌더마다 현재 대목·가림막·딥링크를 흘려 넣어 상태를 맞춘다 */
  | {
      type: 'sync'
      passageId: number | undefined
      isMasked: boolean
      /** 목록에서 찾아낸 딥링크 대상 — 아직 못 찾았거나 닫혔으면 null */
      deepLinkOpinionId: number | null
    }
  /** 흔적의 댓글 아이콘 — 그 의견의 답글 시트를 올린다(디자인 주석 229:18243) */
  | { type: 'openReply'; opinionId: number }
  | { type: 'closeReply' }
