import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { passageQueries } from '@/app/_global/_queries/passage.queries'

import {
  PAGE_PRELOAD_MARGIN,
  resolveQuoteIndex,
  resolveSwipeTarget,
} from '../_services/passageSwipe.service'
import type { SwipeDirection } from '../_types/readerHighlights.type'
import { useHighlightViewer } from './useHighlightViewer'

/** 인용문 무대 흐름 — 대목 페이지 목록 → 페이지 선택 → 페이지별 대목 조회 체인을 소유한다.
    activePassage·isRevealed는 흔적 목록 흐름도 쓰므로 이 훅은 셸(TraceCollapseView)에서 호출한다 */
export function usePassageViewer(bookId: number) {
  const runWithLogin = useLoginGate()
  const pageNumbersQuery = useInfiniteQuery(passageQueries.pageNumbers(bookId))
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

  // 기본 문구가 범용이라 페이지 탭 게이트는 전용 문구를 명시적으로 넘긴다
  const viewer = useHighlightViewer((action) => {
    runWithLogin(action, LOGIN_GATE_MESSAGE.pageView)
  }, pages[0])
  const passagesQuery = useQuery({
    ...passageQueries.passagesByPage(bookId, viewer.activePage ?? 0),
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
  // 커서는 이전 페이지로 넘어올 때 'last'로 남아 있을 수 있어 대목이 도착한 지금 인덱스로 푼다
  const quoteIndex = resolveQuoteIndex(viewer.quoteCursor, passages.length)
  // 선택된 대목 — quoteIndex가 바뀌면 passageId도 함께 바뀌어 흔적 목록이 갱신된다
  const activePassage = passages[quoteIndex]

  const { fetchNextPage } = pageNumbersQuery
  const pageIndex = viewer.activePage === undefined ? -1 : pages.indexOf(viewer.activePage)
  // 목록 끝에 다가가면 미리 채워둔다 — 탭을 스크롤하지 않고 스와이프로만 이동해도 경계에서 막히지 않도록
  useEffect(() => {
    if (!canLoadMorePages || pageIndex < 0) return
    if (pages.length - pageIndex > PAGE_PRELOAD_MARGIN) return
    void fetchNextPage()
  }, [canLoadMorePages, pageIndex, pages.length, fetchNextPage])

  const failedQueries = [pageNumbersQuery, passagesQuery].filter((query) => query.isError)

  return {
    bookTitle,
    bookCoverImageUrl,
    pages,
    highlight,
    quoteIndex,
    isRevealed: viewer.isRevealed,
    selectPage: viewer.select,
    // 카드 탭은 가림막 해제만 한다 — 대목 이동은 스와이프가 맡는다
    clickQuote: () => {
      if (activePassage?.isSpoiler && !viewer.isRevealed) viewer.reveal()
    },
    swipeQuote: (direction: SwipeDirection) => {
      const target = resolveSwipeTarget({
        direction,
        quoteIndex,
        quoteCount: passages.length,
        pages,
        activePage: viewer.activePage,
      })
      if (!target) return
      if (target.type === 'quote') {
        viewer.goToQuote(target.quoteIndex)
        return
      }
      viewer.goToPage(target.page, target.cursor)
    },
    loadMorePages: canLoadMorePages
      ? () => {
          void fetchNextPage()
        }
      : undefined,
    activePassage,
    isError: failedQueries.length > 0,
    retry: () => {
      for (const query of failedQueries) void query.refetch()
    },
  }
}
