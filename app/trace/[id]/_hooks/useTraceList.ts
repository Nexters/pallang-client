import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { opinionQueries, type OpinionSortType } from '@/app/_global/_queries/opinion.queries'

import { DEFAULT_OPINION_SORT_TYPE } from '../_data/readerHighlights.constant'

/** 흔적 목록 흐름 — 목록 조회·정렬·상세 선택을 소유한다. 정렬/필터/상세 액션 확장은 여기에 쌓는다 */
export function useTraceList(passageId: number | undefined, initialTraceId?: number) {
  // 서버 프리페치가 채운 queryKey와 맞아야 첫 렌더에서 캐시가 그대로 쓰인다
  const [sortType, setSortType] = useState<OpinionSortType>(DEFAULT_OPINION_SORT_TYPE)
  // 딥링크로 들어오면 그 흔적이 상세로 열린 채 시작한다. 목록에 없으면(다른 대목으로 옮긴 뒤 등)
  // selectedTrace가 undefined라 아무 일도 일어나지 않는다.
  const [selectedTraceId, setSelectedTraceId] = useState<null | number>(initialTraceId ?? null)

  const opinionsQuery = useInfiniteQuery(opinionQueries.listByPassage(passageId, sortType))
  const traces = useMemo(
    () => opinionsQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [opinionsQuery.data],
  )
  // 헤더 숫자는 서버가 알려준 전체 개수라, 목록을 끝까지 불러오면 둘이 맞는다
  const traceCount = opinionsQuery.data?.pages[0]?.data?.pageInfo.totalElements ?? 0

  const selectedTrace = traces.find((trace) => trace.opinionId === selectedTraceId)

  // placeholderData로 이전 대목의 목록이 보이는 동안에는 다음 페이지를 당기지 않는다
  const canFetchMore =
    opinionsQuery.hasNextPage &&
    !opinionsQuery.isError &&
    !opinionsQuery.isFetchingNextPage &&
    !opinionsQuery.isPlaceholderData

  return {
    traces,
    traceCount,
    sortType,
    toggleSort: () => {
      setSortType((prev) => (prev === 'LATEST' ? 'LIKES' : 'LATEST'))
    },
    selectedTrace,
    selectTrace: (traceId: number) => {
      setSelectedTraceId(traceId)
    },
    closeTrace: () => {
      setSelectedTraceId(null)
    },
    canFetchMore,
    fetchMore: () => {
      void opinionsQuery.fetchNextPage()
    },
    isError: opinionsQuery.isError,
    retry: () => {
      if (opinionsQuery.isError) void opinionsQuery.refetch()
    },
  }
}
