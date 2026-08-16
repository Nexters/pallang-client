/* 딥링크가 지목한 흔적을 목록에서 찾아내는 규칙.
   흔적 목록은 20개씩 오므로 지목된 흔적이 첫 묶음 밖에 있을 수 있다 —
   그대로 두면 상세가 열리지 않고 아무 안내도 없어, 링크를 눌렀는데 아무 일도 없는 것처럼 보인다. */

/** 지목된 흔적을 찾으려고 목록을 더 받아 볼 횟수. 한 묶음이 20개라 5번이면 100개 분량이다. */
export const MISSING_TRACE_FETCH_LIMIT = 5

export type TraceHuntAction =
  /** 할 일 없음 — 지목된 흔적이 없거나 이미 찾았다 */
  | 'none'
  /** 아직 목록이 오는 중이라 없다고 단정할 수 없다 */
  | 'wait'
  | 'fetchMore'
  /** 더 받을 것이 없거나 상한에 닿았다 — 못 찾았다고 알린다 */
  | 'giveUp'

export function resolveTraceHunt(input: {
  /** 딥링크가 지목한 흔적 — 없으면 null */
  targetTraceId: number | null
  isFound: boolean
  /** 목록이 아직 오는 중인지(첫 조회·다음 묶음·이전 대목의 목록을 보여주는 중 모두 포함) */
  isLoading: boolean
  canFetchMore: boolean
  attempts: number
}): TraceHuntAction {
  const { targetTraceId, isFound, isLoading, canFetchMore, attempts } = input
  if (targetTraceId === null || isFound) return 'none'
  if (isLoading) return 'wait'
  if (canFetchMore && attempts < MISSING_TRACE_FETCH_LIMIT) return 'fetchMore'
  return 'giveUp'
}
