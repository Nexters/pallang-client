import { queryOptions } from '@tanstack/react-query'

import type { GetOpinionsParams } from '../_apis/_generated/models/getOpinionsParams'
import { getOpinions } from '../_apis/_generated/opinion/opinion'

export const opinionQueries = {
  all: () => ['opinion'] as const,
  listByPassage: (passageId: number, sortType: GetOpinionsParams['sortType']) =>
    queryOptions({
      queryKey: [...opinionQueries.all(), 'by-passage', passageId, sortType],
      // ponytail: size 100 고정 — 흔적이 100개를 넘으면 페이지네이션 필요
      queryFn: () => getOpinions(passageId, { sortType, size: 100 }),
    }),
}
