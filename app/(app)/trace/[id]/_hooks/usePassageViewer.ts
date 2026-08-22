import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { passageQueries } from '@/app/_global/_queries/passage.queries'
import type { TraceTarget } from '@/app/_shared/trace/_data/traceTarget.model'

import {
  resolveQuoteIndex,
  resolveSwipeTarget,
  shouldLoadMorePages,
} from '../_services/passageSwipe.service'
import { isSpoilerCovered } from '../_services/spoiler.service'
import type { SwipeDirection } from '../_types/readerHighlights.type'
import { useHighlightViewer } from './useHighlightViewer'

/** 인용문 무대 흐름 — 대목 페이지 목록 → 페이지 선택 → 페이지별 대목 조회 체인을 소유한다.
    activePassage·isRevealed는 흔적 목록 흐름도 쓰므로 이 훅은 셸(TraceScreen)에서 호출한다 */
export function usePassageViewer(bookId: number, target?: TraceTarget | null, groupId?: number) {
  const pageNumbersQuery = useInfiniteQuery(passageQueries.pageNumbers(bookId, groupId))
  const pages = useMemo(
    () => pageNumbersQuery.data?.pages.flatMap((page) => page.data?.pageNumbers ?? []) ?? [],
    [pageNumbersQuery.data],
  )
  const canLoadMorePages =
    pageNumbersQuery.hasNextPage &&
    !pageNumbersQuery.isError &&
    !pageNumbersQuery.isFetchingNextPage
  // 책 제목·표지는 대목 페이지 목록 응답에 함께 실려 온다 — 도착 전에는 빈 값으로 자리만 지킨다
  const bookInfo = pageNumbersQuery.data?.pages[0]?.data
  const bookTitle = bookInfo?.bookTitle ?? ''
  const bookCoverImageUrl = bookInfo?.coverImageUrl ?? null

  const viewer = useHighlightViewer(
    pages[0],
    // 딥링크는 쪽 번호까지만 실어 올 수 있다 — 그 쪽의 몇 번째 대목인지는 대목이 도착해야 정해진다
    target ? { page: target.pageNumber, cursor: { passageId: target.passageId } } : undefined,
  )
  const passagesQuery = useQuery({
    ...passageQueries.passagesByPage(bookId, viewer.activePage ?? 0, groupId),
    enabled: viewer.activePage !== undefined,
  })

  const passages = useMemo(() => passagesQuery.data?.data?.passages ?? [], [passagesQuery.data])
  const highlight = useMemo(
    () => ({
      page: viewer.activePage ?? 0,
      quotes: passages.map((passage) => ({
        text: passage.quotedText,
        isSpoiler: passage.isSpoiler,
        decorations: passage.decorations,
      })),
    }),
    [passages, viewer.activePage],
  )
  // 커서는 'last'나 지목된 대목으로 남아 있을 수 있어 대목이 도착한 지금 인덱스로 푼다
  const quoteIndex = resolveQuoteIndex(
    viewer.quoteCursor,
    passages.map((passage) => passage.passageId),
  )
  // 선택된 대목 — quoteIndex가 바뀌면 passageId도 함께 바뀌어 흔적 목록이 갱신된다
  const activePassage = passages[quoteIndex]
  // 해제는 대목 단위라 지금 보고 있는 대목을 열어본 적 있는지만 본다
  const isRevealed = viewer.isRevealed(activePassage?.passageId)

  const { fetchNextPage } = pageNumbersQuery
  const pageIndex = viewer.activePage === undefined ? -1 : pages.indexOf(viewer.activePage)
  // 딥링크는 아직 안 받은 묶음의 쪽을 가리킬 수 있다 — 그 쪽이 목록에 없으면 이웃 쪽을 특정할 수 없어
  // 쪽 이동이 통째로 막힌다. 나올 때까지 이어 받되(상한까지), 헛되이 반복하지 않게 횟수를 센다
  const isActivePageMissing = viewer.activePage !== undefined && pageIndex < 0
  const missingPageFetchesRef = useRef(0)
  useEffect(() => {
    if (!isActivePageMissing) missingPageFetchesRef.current = 0
  }, [isActivePageMissing])

  // 목록 끝에 다가가면 미리 채워둔다 — 탭을 스크롤하지 않고 스와이프로만 이동해도 경계에서 막히지 않도록
  useEffect(() => {
    const shouldLoad = shouldLoadMorePages({
      canLoadMore: canLoadMorePages,
      isActivePageMissing,
      missingPageFetches: missingPageFetchesRef.current,
      pageIndex,
      loadedCount: pages.length,
    })
    if (!shouldLoad) return
    if (isActivePageMissing) missingPageFetchesRef.current += 1
    void fetchNextPage()
  }, [canLoadMorePages, isActivePageMissing, pageIndex, pages.length, fetchNextPage])

  // 페이저가 세는 자리 — 대목이 아니라 '대목이 있는 쪽' 중 몇 번째 쪽인가.
  // 총 쪽 수는 쪽 목록 응답의 pageInfo가 이미 들고 와서(불러온 묶음 수와 무관하다) 따로 더 받지 않는다.
  // 아직 목록에 없는 쪽으로 딥링크해 들어온 순간(pageIndex < 0)에는 0으로 눌러 첫 쪽처럼 세운다 —
  // 그 쪽이 도착하면 곧바로 제자리를 찾는다
  const pagePosition = {
    index: Math.max(pageIndex, 0),
    // 쪽이 하나도 없어도 "01 / 00"이 아니라 "01 / 01"로 선다
    total: Math.max(bookInfo?.pageInfo.totalElements ?? pages.length, 1),
  }

  // 대목 이동의 판정은 한 곳뿐이다 — 화살표(QuotePager)의 활성 여부와 스와이프의 실제 이동이
  // 같은 함수를 보므로, 눌러도 아무 일 없는 화살표나 막힌 척하는 화살표가 생기지 않는다
  const resolveTarget = (direction: SwipeDirection) =>
    resolveSwipeTarget({
      direction,
      quoteIndex,
      quoteCount: passages.length,
      pages,
      activePage: viewer.activePage,
    })

  const failedQueries = [pageNumbersQuery, passagesQuery].filter((query) => query.isError)
  const loadMorePages = canLoadMorePages
    ? () => {
        void fetchNextPage()
      }
    : undefined

  return {
    bookTitle,
    bookCoverImageUrl,
    highlight,
    quoteIndex,
    pagePosition,
    isRevealed,
    // 쪽 선택기는 고를 쪽이 도착한 뒤에 선다 — 빈 목록으로 세우면 아직 없는 쪽이 표시된다
    pageNav:
      pages.length > 0
        ? {
            pages,
            activePage: viewer.activePage,
            onSelectPage: viewer.select,
            onLoadMorePages: loadMorePages,
          }
        : undefined,
    // 카드 탭은 가림막 해제만 한다 — 대목 이동은 스와이프가 맡는다
    clickQuote: () => {
      if (!activePassage) return
      if (isSpoilerCovered({ isSpoiler: activePassage.isSpoiler, isRevealed })) {
        viewer.reveal(activePassage.passageId)
      }
    },
    // 갈 곳이 있는 방향 — 쪽 경계를 넘는 이동까지 포함한다(불러온 범위의 처음/끝에서만 막힌다)
    canSwipe: {
      prev: resolveTarget('prev') !== undefined,
      next: resolveTarget('next') !== undefined,
    },
    swipeQuote: (direction: SwipeDirection) => {
      const target = resolveTarget(direction)
      if (!target) return
      if (target.type === 'quote') {
        viewer.goToQuote(target.quoteIndex)
        return
      }
      viewer.goToPage(target.page, target.cursor)
    },
    activePassage,
    // 첫 응답이 도착했는데 쪽이 하나도 없다 — 로딩·실패와 구분되는 "정말 비어 있음"이다.
    // 로딩 중을 비어 있음으로 읽으면 스켈레톤 대신 빈 상태 안내가 번쩍인다
    isEmpty: !pageNumbersQuery.isPending && !pageNumbersQuery.isError && pages.length === 0,
    isError: failedQueries.length > 0,
    retry: () => {
      for (const query of failedQueries) void query.refetch()
    },
  }
}
