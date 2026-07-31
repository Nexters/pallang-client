import { useState } from 'react'

import type { Highlight } from '../_types/readerHighlights.type'

export function useHighlightViewer(
  requireLogin: (action: () => void) => void,
  firstPage: number | undefined,
) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)
  // 해제 상태는 페이지 단위로 유지된다 — 같은 페이지의 다른 스포일러 대목으로 넘어가도 다시 가리지 않는다
  const [isRevealed, setIsRevealed] = useState(false)
  const activePage = selectedPage ?? firstPage

  const select = (page: number) => {
    const apply = () => {
      setSelectedPage(page)
      setQuoteIndex(0)
      setIsRevealed(false)
    }
    // 비로그인 시 첫 번째 페이지의 기록만 열람 가능
    if (page === firstPage) {
      apply()
      return
    }
    requireLogin(apply)
  }

  const clickCard = (highlight: Highlight) => {
    // 스포일러는 대목 단위라 지금 보고 있는 대목만 보고 가림막 해제 여부를 정한다
    if (highlight.quotes[quoteIndex]?.isSpoiler && !isRevealed) {
      setIsRevealed(true)
      return
    }
    if (highlight.quotes.length === 0) return
    setQuoteIndex((prev) => (prev + 1) % highlight.quotes.length)
  }

  return { activePage, quoteIndex, isRevealed, select, clickCard }
}
