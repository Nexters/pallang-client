import { useState } from 'react'

import type { QuoteCursor } from '../_types/readerHighlights.type'

export function useHighlightViewer(
  requireLogin: (action: () => void) => void,
  firstPage: number | undefined,
  /** 목록 화면에서 지목해 들어온 시작 위치 — 사용자가 페이지·대목을 옮기면 그대로 덮인다 */
  initialPosition?: { page: number; cursor: QuoteCursor },
) {
  const [selectedPage, setSelectedPage] = useState<null | number>(initialPosition?.page ?? null)
  const [quoteCursor, setQuoteCursor] = useState<QuoteCursor>(initialPosition?.cursor ?? 0)
  // 해제 상태는 페이지 단위로 유지된다 — 같은 페이지의 다른 스포일러 대목으로 넘어가도 다시 가리지 않는다
  const [isRevealed, setIsRevealed] = useState(false)
  const activePage = selectedPage ?? firstPage

  /** 페이지 이동의 유일한 통로 — 탭 선택도 스와이프도 같은 로그인 게이트를 지난다 */
  const openPage = (page: number, cursor: QuoteCursor) => {
    const apply = () => {
      setSelectedPage(page)
      setQuoteCursor(cursor)
      setIsRevealed(false)
    }
    // 비로그인 시 첫 번째 페이지의 기록만 열람 가능
    if (page === firstPage) {
      apply()
      return
    }
    requireLogin(apply)
  }

  return {
    activePage,
    quoteCursor,
    isRevealed,
    select: (page: number) => {
      openPage(page, 0)
    },
    goToPage: openPage,
    goToQuote: (index: number) => {
      setQuoteCursor(index)
    },
    reveal: () => {
      setIsRevealed(true)
    },
  }
}
