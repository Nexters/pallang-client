import { keepPreviousData, queryOptions, skipToken } from '@tanstack/react-query'

import type { GetOpinionsParams } from '../_apis/_generated/models/getOpinionsParams'
import { getOpinions } from '../_apis/_generated/opinion/opinion'

/** feature 코드는 _apis를 직접 import할 수 없어 정렬 타입을 여기서 재노출한다 */
export type OpinionSortType = NonNullable<GetOpinionsParams['sortType']>

export const opinionQueries = {
  all: () => ['opinion'] as const,
  listByPassage: (passageId: number | undefined, sortType: OpinionSortType) =>
    queryOptions({
      queryKey: [...opinionQueries.all(), 'by-passage', passageId, sortType],
      // 정렬·대목 전환 시 이전 목록을 유지해 "0개의 흔적" 깜빡임을 막는다
      placeholderData: keepPreviousData,
      // ponytail: size 100 고정 — 흔적이 100개를 넘으면 페이지네이션 필요
      queryFn:
        passageId === undefined ? skipToken : () => getOpinions(passageId, { sortType, size: 100 }),
    }),
}
