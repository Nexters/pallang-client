'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { bookQueries } from '@/app/_global/_queries/book.queries'

import { findBookDetail, isBookDetailMissing } from '../_services/bookDetail.service'
import { useTraceDraft } from './useTraceDraft'

/** 제목으로 좁혀 부르는 조회다. 같은 제목의 판본이 이보다 많으면 그중에 없을 수도 있고, 그때는 그냥 둔다. */
const SEARCH_SIZE = 20

/**
 * 초안에 담긴 책의 빈 저자·쪽수를 내부 검색으로 뒤늦게 채운다.
 *
 * 흔적 보기 화면이 넘기는 씨앗은 제목과 표지만 안다(그 화면의 책 정보가 PageNumbers 응답에서
 * 오고, 단일 도서 조회 API가 없다). 그대로 두면 ③의 책 카드에 저자 줄이 비고, 저장 직전의
 * '페이지가 쪽수를 넘는가' 검사가 쪽수를 몰라 조용히 아무 일도 하지 않는다.
 *
 * 플로우 전체(layout)에 매달아 두는 이유는 두 가지다.
 * - 첫 화면에서 씨앗이 내려앉는 순간 조회가 시작되어, 사용자가 ①·②를 지나 ③에 닿을 때는
 *   이미 채워져 있다. ③에서 시작하면 저자가 카드에 뒤늦게 나타나고, 무엇보다 바로 '기록 완료'를
 *   누른 사람에게는 쪽수 검사가 또 비어 있다.
 * - 대목까지 물고 들어온 경로에서는 ①이 곧 저장 화면이라 ③을 아예 지나지 않는다.
 *
 * 어떤 경우에도 화면을 막거나 오류를 알리지 않는다 — 못 찾으면 초안은 들어온 그대로다.
 */
export function useBookDetailFill(): void {
  const { draft, dispatch } = useTraceDraft()
  const { book } = draft
  const bookId = book?.bookId ?? null
  const title = book?.title ?? ''
  const isMissing = isBookDetailMissing(book)

  // 시도를 세는 상태를 따로 두지 않는다 — 캐시가 곧 그 기록이다.
  // 조회는 제목으로 키가 갈리고(bookQueries.searchInternal), staleTime을 무한으로 두면
  // 그 키의 답은 한 번만 받아온다: 마운트·포커스 복귀·재렌더 어느 것도 다시 부르지 않는다.
  // 채우고 나서도 '덜 찼다'가 그대로인 경우(결과에 그 책이 없거나, 찾은 저자마저 빈 문자열)
  // enabled 조건은 계속 참인데, 되묻기를 막는 것이 바로 이 staleTime이다.
  const search = useInfiniteQuery({
    ...bookQueries.searchInternal({ keyword: title, size: SEARCH_SIZE }),
    enabled: isMissing && bookId !== null && title.length > 0,
    staleTime: Infinity,
  })

  const { isFetched } = search
  // 통합 검색이 생기면서 응답의 bookId·pageCount가 선택 항목이 됐다(미등록 도서는 비어 있다).
  // 채울 값이 없는 항목은 후보에서 뺀다 — 내부 검색 결과라 실제로는 모두 채워져 있다.
  const candidates =
    search.data?.pages.flatMap((page) =>
      (page.data?.books ?? []).flatMap((book) =>
        book.bookId == null || book.pageCount == null
          ? []
          : [{ author: book.author, bookId: book.bookId, pageCount: book.pageCount }],
      ),
    ) ?? []
  const detail = bookId === null ? null : findBookDetail(candidates, bookId)

  // 채우기도 한 번이다. detail은 위에서 매 렌더 새로 만드는 객체라 effect가 다시 돌 수 있지만,
  // reducer가 채울 것이 없으면 상태를 그대로 돌려준다(useReducer가 같은 상태에 리렌더를 만들지
  // 않는다) — 채우기 → 리렌더 → 다시 채우기로 도는 길은 그쪽에서 막혀 있다.
  useEffect(() => {
    if (!isMissing || bookId === null || !isFetched) return
    // 결과에 이 책이 없으면 채울 값이 없다. 초안을 그대로 두고 조용히 끝낸다.
    if (!detail) return
    dispatch({
      type: 'fillBookDetail',
      bookId,
      author: detail.author,
      pageCount: detail.pageCount,
    })
  }, [bookId, detail, dispatch, isFetched, isMissing])
}
