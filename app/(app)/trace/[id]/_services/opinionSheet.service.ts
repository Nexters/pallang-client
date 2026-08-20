/* 답글 시트 흐름의 상태기계.
   React 없이 상태와 전이만 다룬다 — 훅에 섞어 두면 "가려지면 열 수 없다" 같은 규칙이
   여닫는 자리마다 흩어져 집행 지점이 늘어난다. */

import type { OpinionSheetAction, OpinionSheetModel } from '../_types/opinionSheet.type'

export function createOpinionSheetModel(input: {
  passageId: number | undefined
  isMasked: boolean
}): OpinionSheetModel {
  return {
    replyOpinionId: null,
    appliedDeepLinkOpinionId: null,
    passageId: input.passageId,
    isMasked: input.isMasked,
  }
}

/**
 * 바뀔 것이 없으면 받은 상태를 그대로 돌려준다 —
 * 'sync'는 렌더 도중에 불리므로 매번 새 객체를 만들면 렌더가 멎지 않는다.
 */
export function opinionSheetReducer(
  state: OpinionSheetModel,
  action: OpinionSheetAction,
): OpinionSheetModel {
  // 가려진 의견은 답글로도 읽을 수 없어야 한다. 블러는 그림이고 inert는 브라우저에만 있는
  // 방어라, 규칙은 여기 한 곳에서 집행한다(#49). 닫는 길까지 막으면 갇히므로 여는 쪽만 막는다.
  if (state.isMasked && action.type === 'openReply') return state

  switch (action.type) {
    case 'sync': {
      // 대목이 바뀌면 목록이 통째로 갈리므로 답글 시트도 함께 닫는다 — 남겨두면 화면에 보이지도 않는
      // 이전 대목의 의견에 답글이 등록된다(#128).
      const isPassageChanged = state.passageId !== action.passageId
      // 가림막이 다시 씌워지면(같은 페이지 탭을 다시 눌러 해제가 풀리는 경우) passageId는 그대로라
      // 위의 리셋에 걸리지 않는다. 시트가 남으면 더는 읽을 수 없는 의견에 답글을 쓸 수 있다.
      const isMaskReapplied = action.isMasked && state.replyOpinionId !== null
      const shouldReset = isPassageChanged || isMaskReapplied

      // 딥링크가 지목한 흔적은 목록에 도착하는 순간 한 번만 연다.
      // 가려져 있으면 열지도, 열었다고 기억하지도 않는다 → 가림막이 풀리는 렌더에서 다시 시도한다(#49)
      const deepLink = action.deepLinkOpinionId
      const shouldOpenDeepLink =
        deepLink !== null && deepLink !== state.appliedDeepLinkOpinionId && !action.isMasked

      const next: OpinionSheetModel = {
        replyOpinionId: shouldOpenDeepLink ? deepLink : shouldReset ? null : state.replyOpinionId,
        // 지목이 풀리면(시트를 닫으면) 기억도 함께 지운다 — 다음 지목을 다시 받을 수 있게
        appliedDeepLinkOpinionId:
          deepLink === null ? null : shouldOpenDeepLink ? deepLink : state.appliedDeepLinkOpinionId,
        passageId: action.passageId,
        isMasked: action.isMasked,
      }

      const isUnchanged =
        next.replyOpinionId === state.replyOpinionId &&
        next.appliedDeepLinkOpinionId === state.appliedDeepLinkOpinionId &&
        next.passageId === state.passageId &&
        next.isMasked === state.isMasked
      return isUnchanged ? state : next
    }
    case 'openReply':
      if (state.replyOpinionId === action.opinionId) return state
      return { ...state, replyOpinionId: action.opinionId }
    case 'closeReply':
      if (state.replyOpinionId === null) return state
      return { ...state, replyOpinionId: null }
  }
}
