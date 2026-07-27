import { useState } from 'react'

import { firstHighlight } from '../_data/readerHighlights.constant'
import type { Highlight } from '../_types/readerHighlights.type'

export function useHighlightViewer(requireLogin: (action: () => void) => void) {
  const [highlight, setHighlight] = useState(firstHighlight)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)

  const select = (next: Highlight) => {
    const apply = () => {
      setHighlight(next)
      setQuoteIndex(0)
      setIsRevealed(false)
    }
    // 비로그인 시 첫 번째 페이지의 기록만 열람 가능
    if (next.page === firstHighlight.page) {
      apply()
      return
    }
    requireLogin(apply)
  }

  const clickCard = () => {
    if (highlight.isSpoiler && !isRevealed) {
      setIsRevealed(true)
      return
    }
    setQuoteIndex((prev) => (prev + 1) % highlight.quotes.length)
  }

  return { highlight, quoteIndex, isRevealed, select, clickCard }
}
