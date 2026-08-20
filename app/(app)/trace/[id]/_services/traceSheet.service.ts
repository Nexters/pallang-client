/* 어두운 시트의 높이 판정.
   시트를 끄는 손짓과 스냅 규칙을 순수 함수로 여기에 모아, 훅(useTraceSheet)은
   터치 이벤트와 상태 수명만 붙인다. */

import { SHEET_TOP_DEFAULT, SHEET_TOP_EXPANDED } from '../_data/quoteStage.constant'

/** 손을 뗀 자리가 두 지점 사이 어디쯤이면 올린 것으로 볼지.
    가운데(0.5)보다 낮게 잡아, 조금만 끌어 올려도 확장으로 붙게 한다 —
    되돌리는 쪽(handle을 아래로)은 언제나 크게 끌게 되므로 한쪽으로 기울여도 헷갈리지 않는다 */
const EXPAND_SNAP_RATIO = 0.35

/** 시트가 오르내리는 거리 */
export const SHEET_TRAVEL = SHEET_TOP_DEFAULT - SHEET_TOP_EXPANDED

/** 끄는 동안의 시트 윗면 — 두 지점 밖으로는 나가지 않는다(고무줄 없이 딱 멈춘다) */
export function clampSheetTop(top: number): number {
  if (top < SHEET_TOP_EXPANDED) return SHEET_TOP_EXPANDED
  if (top > SHEET_TOP_DEFAULT) return SHEET_TOP_DEFAULT
  return top
}

/** 손을 뗐을 때 붙을 자리 — 두 지점 중 하나로만 떨어진다(중간 높이는 없다) */
export function snapSheetExpanded(top: number): boolean {
  return top <= SHEET_TOP_EXPANDED + SHEET_TRAVEL * EXPAND_SNAP_RATIO
}
