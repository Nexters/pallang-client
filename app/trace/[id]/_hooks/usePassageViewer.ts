import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { passageQueries } from '@/app/_global/_queries/passage.queries'

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
      })),
    }),
    [passages, viewer.activePage],
  )
  // 선택된 대목 — quoteIndex가 바뀌면 passageId도 함께 바뀌어 흔적 목록이 갱신된다
  const activePassage = passages[viewer.quoteIndex]

  const failedQueries = [pageNumbersQuery, passagesQuery].filter((query) => query.isError)

  return {
    bookTitle,
    bookCoverImageUrl,
    pages,
    highlight,
    quoteIndex: viewer.quoteIndex,
    isRevealed: viewer.isRevealed,
    selectPage: viewer.select,
    clickQuote: () => {
      viewer.clickCard(highlight)
    },
    loadMorePages: canLoadMorePages
      ? () => {
          void pageNumbersQuery.fetchNextPage()
        }
      : undefined,
    activePassage,
    isError: failedQueries.length > 0,
    retry: () => {
      for (const query of failedQueries) void query.refetch()
    },
  }
}
