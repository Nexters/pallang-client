import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { opinionQueries, type OpinionSortType } from '@/app/_global/_queries/opinion.queries'

import {
  DEFAULT_OPINION_SORT_TYPE,
  TRACE_NOT_FOUND_MESSAGE,
} from '../_data/readerHighlights.constant'
import { resolveTraceHunt } from '../_services/traceHunt.service'
import { useTraceMessage } from './useTraceMessage'

type UseTraceListParams = {
  passageId: number | undefined
  /** 딥링크로 지목된 흔적 — 목록이 도착하면 상세가 열린 채 시작한다 */
  initialTraceId?: number
  /** 대목 조회가 깨지면 흔적도 조회할 수 없으므로(passageId가 없어 skipToken) 같은 에러로 묶는다 */
  stageError: { isError: boolean; retry: () => void }
}

/** 흔적 목록 흐름 — 목록 조회·정렬·딥링크로 지목된 상세를 소유한다. 정렬/필터 확장은 여기에 쌓는다 */
export function useTraceList({ passageId, initialTraceId, stageError }: UseTraceListParams) {
  // 서버 프리페치가 채운 queryKey와 맞아야 첫 렌더에서 캐시가 그대로 쓰인다
  const [sortType, setSortType] = useState<OpinionSortType>(DEFAULT_OPINION_SORT_TYPE)
  // 상세로 들어오는 길은 딥링크뿐이다(목록에서 흔적을 눌러도 상세는 열리지 않는다).
  // 목록에 없으면(다른 대목으로 옮긴 뒤 등) selectedTrace가 null이라 아무 일도 일어나지 않는다.
  const [selectedTraceId, setSelectedTraceId] = useState<null | number>(initialTraceId ?? null)

  const opinionsQuery = useInfiniteQuery(opinionQueries.listByPassage(passageId, sortType))
  const traces = useMemo(
    () => opinionsQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [opinionsQuery.data],
  )
  // 헤더 숫자는 서버가 알려준 전체 개수라, 목록을 끝까지 불러오면 둘이 맞는다
  const traceCount = opinionsQuery.data?.pages[0]?.data?.pageInfo.totalElements ?? 0

  // 목록에서 의견을 집는 유일한 자리 — 상세도 시트도 이 조회를 함께 쓴다
  const findTrace = (opinionId: number | null) =>
    traces.find((trace) => trace.opinionId === opinionId) ?? null

  // placeholderData로 이전 대목의 목록이 보이는 동안에는 다음 페이지를 당기지 않는다
  const canFetchMore =
    opinionsQuery.hasNextPage &&
    !opinionsQuery.isError &&
    !opinionsQuery.isFetchingNextPage &&
    !opinionsQuery.isPlaceholderData

  /**
   * 딥링크가 지목한 흔적은 첫 묶음(20개) 밖에 있을 수 있다 — 그대로 두면 상세가 열리지도,
   * 아무 안내가 뜨지도 않아 링크를 눌렀는데 아무 일도 없는 것처럼 보인다.
   * 나올 때까지 이어 받고(상한까지), 끝까지 없으면 못 찾았다고 알린다.
   */
  const { show } = useTraceMessage()
  const huntAttemptsRef = useRef(0)
  const hasGivenUpRef = useRef(false)
  const { fetchNextPage } = opinionsQuery
  const isTargetFound = findTrace(selectedTraceId) !== null
  const isListLoading =
    opinionsQuery.isPending || opinionsQuery.isFetching || opinionsQuery.isPlaceholderData
  // 판정 자체는 순수 함수지만 부르는 자리는 effect 안이다 — 횟수를 든 ref는 렌더 중에 읽지 않는다
  useEffect(() => {
    const action = resolveTraceHunt({
      targetTraceId: selectedTraceId,
      isFound: isTargetFound,
      isLoading: isListLoading,
      canFetchMore,
      attempts: huntAttemptsRef.current,
    })
    if (action === 'fetchMore') {
      huntAttemptsRef.current += 1
      void fetchNextPage()
      return
    }
    // 못 찾았다는 안내는 한 번이면 된다. 지목은 그대로 둬도 목록에 없으니 상세는 열리지 않는다
    if (action === 'giveUp' && !hasGivenUpRef.current) {
      hasGivenUpRef.current = true
      show(TRACE_NOT_FOUND_MESSAGE)
    }
  }, [selectedTraceId, isTargetFound, isListLoading, canFetchMore, fetchNextPage, show])

  return {
    traces,
    traceCount,
    sortType,
    changeSort: (nextSortType: OpinionSortType) => {
      setSortType(nextSortType)
    },
    findTrace,
    selectedTrace: findTrace(selectedTraceId),
    closeTrace: () => {
      setSelectedTraceId(null)
    },
    canFetchMore,
    fetchMore: () => {
      void opinionsQuery.fetchNextPage()
    },
    // 대목과 흔적은 한 화면을 이루므로 어느 쪽이 깨져도 같은 에러 화면으로 묶는다
    isError: stageError.isError || opinionsQuery.isError,
    retry: () => {
      stageError.retry()
      if (opinionsQuery.isError) void opinionsQuery.refetch()
    },
  }
}
