/* 의견 시트 흐름의 상태기계.
   React 없이 상태와 전이만 다룬다 — 훅에 섞어 두면 "가려지면 열 수 없다" 같은 규칙이
   여닫는 자리마다 흩어져 집행 지점이 늘어난다. */

import type { OpinionSheetAction, OpinionSheetModel } from '../_types/opinionSheet.type'

export function createOpinionSheetModel(input: {
  passageId: number | undefined
  isMasked: boolean
}): OpinionSheetModel {
  return {
    sheet: null,
    expandedOpinionId: null,
    passageId: input.passageId,
    isMasked: input.isMasked,
  }
}

/** 여는 방향의 전이인지 — 가림막은 여는 쪽만 막는다(닫는 길까지 막으면 갇힌다) */
function isOpening(action: OpinionSheetAction): boolean {
  return (
    action.type === 'openSheet' ||
    action.type === 'selectOpinion' ||
    action.type === 'toggleComments'
  )
}

/**
 * 바뀔 것이 없으면 받은 상태를 그대로 돌려준다 —
 * 'sync'는 렌더 도중에 불리므로 매번 새 객체를 만들면 렌더가 멎지 않는다.
 */
export function opinionSheetReducer(
  state: OpinionSheetModel,
  action: OpinionSheetAction,
): OpinionSheetModel {
  // 가려진 의견은 시트에서도, 댓글로도 읽을 수 없어야 한다.
  // 블러는 그림이고 inert는 브라우저에만 있는 방어라, 규칙은 여기 한 곳에서 집행한다(#49).
  if (state.isMasked && isOpening(action)) return state

  switch (action.type) {
    case 'sync': {
      // 대목이 바뀌면 목록이 통째로 갈리므로 시트도 함께 닫는다 — 남겨두면 화면에 보이지도 않는
      // 이전 대목의 의견에 답글이 등록된다(#128).
      const isPassageChanged = state.passageId !== action.passageId
      // 가림막이 다시 씌워지면(같은 페이지 탭을 다시 눌러 해제가 풀리는 경우) passageId는 그대로라
      // 위의 리셋에 걸리지 않는다. 시트가 남으면 더는 읽을 수 없는 의견에 답글을 쓸 수 있다.
      const isMaskReapplied =
        action.isMasked && (state.sheet !== null || state.expandedOpinionId !== null)
      const shouldReset = isPassageChanged || isMaskReapplied
      if (!shouldReset && state.isMasked === action.isMasked) return state

      return {
        sheet: shouldReset ? null : state.sheet,
        expandedOpinionId: shouldReset ? null : state.expandedOpinionId,
        passageId: action.passageId,
        isMasked: action.isMasked,
      }
    }
    case 'openSheet':
      return { ...state, sheet: { opinionId: null } }
    case 'selectOpinion':
      return { ...state, sheet: { opinionId: action.opinionId } }
    case 'showList':
      // 닫힌 시트를 목록 화면으로 되살리지는 않는다 — 되돌아갈 곳은 떠 있는 시트뿐이다
      if (state.sheet?.opinionId == null) return state
      return { ...state, sheet: { opinionId: null } }
    case 'closeSheet':
      if (state.sheet === null) return state
      return { ...state, sheet: null }
    case 'toggleComments':
      return {
        ...state,
        expandedOpinionId: state.expandedOpinionId === action.opinionId ? null : action.opinionId,
      }
  }
}
