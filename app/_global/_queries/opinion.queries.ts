import {
  infiniteQueryOptions,
  keepPreviousData,
  mutationOptions,
  queryOptions,
  skipToken,
} from '@tanstack/react-query'

import type { CreateOpinionRequest } from '../_apis/_generated/models/createOpinionRequest'
import type { GetOpinionsParams } from '../_apis/_generated/models/getOpinionsParams'
import { createOpinion, getOpinions, toggleOpinionLike } from '../_apis/_generated/opinion/opinion'

/** feature 코드는 _apis를 직접 import할 수 없어 정렬 타입을 여기서 재노출한다 */
export type OpinionSortType = NonNullable<GetOpinionsParams['sortType']>

/** 흔적 하나의 좋아요 상태 — 토글 응답(OpinionLikeResponse)에서 필요한 값만 추린다 */
export type OpinionLikeState = {
  liked: boolean
  likeCount: number
}

const OPINION_PAGE_SIZE = 20

/**
 * 서버 프리페치에서 요청 스코프 인증 헤더를 넣기 위한 fetch 옵션(브라우저에서는 생략).
 * queryKey에는 넣지 않는다 — 서버/클라이언트가 같은 캐시 엔트리를 공유해야 한다.
 */
type FetchOptions = Parameters<typeof getOpinions>[2]

export const opinionQueries = {
  all: () => ['opinion'] as const,
  listByPassage: (
    passageId: number | undefined,
    sortType: OpinionSortType,
    options?: FetchOptions,
  ) =>
    infiniteQueryOptions({
      queryKey: [...opinionQueries.all(), 'by-passage', passageId, sortType],
      // 정렬·대목 전환 시 이전 목록을 유지해 "0개의 흔적" 깜빡임을 막는다
      placeholderData: keepPreviousData,
      queryFn:
        passageId === undefined
          ? skipToken
          : ({ pageParam }) =>
              getOpinions(
                passageId,
                { sortType, page: pageParam, size: OPINION_PAGE_SIZE },
                options,
              ),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  /**
   * 이 화면에서 누른 좋아요를 담아두는 캐시. 조회는 하지 않고(skipToken) 토글 응답만 담아,
   * 목록 카드와 상세 오버레이가 같은 값을 보게 한다.
   *
   * 처음 그릴 때의 기준은 이 캐시가 아니라 목록 응답의 `liked`/`likeCount`다(useOpinionLike).
   * 여기 없으면 '아직 안 눌렀다'가 아니라 '이 화면에서 아직 안 눌렀다'는 뜻일 뿐이다.
   */
  likeState: (opinionId: number) =>
    queryOptions<OpinionLikeState>({
      queryKey: [...opinionQueries.all(), 'like', opinionId],
      queryFn: skipToken,
      // 목록이 리페치돼도 유지되도록 세션 동안 캐시를 비우지 않는다
      gcTime: Infinity,
      staleTime: Infinity,
    }),
}

export const opinionMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...opinionQueries.all(), 'create'],
      mutationFn: (data: CreateOpinionRequest) => createOpinion(data),
    }),
  toggleLike: (opinionId: number) =>
    mutationOptions({
      mutationKey: [...opinionQueries.all(), 'like', opinionId],
      mutationFn: () => toggleOpinionLike(opinionId),
    }),
}
