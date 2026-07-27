import { useState } from 'react'

import type { Highlight } from '../_types/readerHighlights.type'

export function useHighlightViewer(
  requireLogin: (action: () => void) => void,
  firstPage: number | undefined,
) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)
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
    if (highlight.isSpoiler && !isRevealed) {
      setIsRevealed(true)
      return
    }
    if (highlight.quotes.length === 0) return
    setQuoteIndex((prev) => (prev + 1) % highlight.quotes.length)
  }

  return { activePage, quoteIndex, isRevealed, select, clickCard }
}
