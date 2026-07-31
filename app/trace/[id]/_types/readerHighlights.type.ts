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
