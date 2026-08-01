import type { Decoration } from '@/app/_shared/trace/_data/decoration.model'

/** 대목 단위 인용문 — 스포일러 여부도, 작성자가 남긴 꾸미기 효과도 대목마다 다르다 */
export type HighlightQuote = {
  text: string
  isSpoiler: boolean
  decorations: Decoration[]
}

export type Highlight = {
  page: number
  quotes: HighlightQuote[]
}

/** 보고 있는 대목의 위치.
    이전 페이지로 넘어갈 때는 그 페이지의 대목 수를 아직 모르므로 'last'로 미뤄두고,
    대목이 도착한 렌더 시점에 실제 인덱스로 푼다(resolveQuoteIndex) */
export type QuoteCursor = number | 'last'

/** 좌우 스와이프 방향 — next는 다음 대목(끝이면 다음 페이지) 쪽 */
export type SwipeDirection = 'next' | 'prev'

/** 상단 스테이지(QuoteStage)가 받는 props */
export type QuoteStageProps = {
  title: string
  pages: number[]
  highlight: Highlight
  quoteIndex: number
  isRevealed: boolean
  isCollapsed: boolean
  onSelectPage: (page: number) => void
  /** 더 불러올 대목 페이지가 있을 때만 전달된다 — 페이지 탭을 끝까지 스크롤하면 호출된다 */
  onLoadMorePages?: () => void
  onClickQuote: () => void
  /** 카드 위 좌우 스와이프(와 좌우 방향키)로 대목·페이지를 옮긴다 */
  onSwipeQuote: (direction: SwipeDirection) => void
  /** 헤더의 + — 이 책에 새 대목을 남기러 간다 */
  onAddTrace: () => void
}

/** 서버 OpinionSummaryResponse 중 목록 UI가 쓰는 필드만 추린 뷰 타입 */
export type Trace = {
  opinionId: number
  nickname: string
  content: string
  createdAt: string
  likeCount: number
}
