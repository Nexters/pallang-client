export type Highlight = {
  page: number
  quotes: string[]
  isSpoiler: boolean
}

/** 시안별 스테이지 컴포넌트가 공통으로 받는 props */
export type QuoteStageProps = {
  title: string
  pages: number[]
  highlight: Highlight
  quoteIndex: number
  isRevealed: boolean
  isCollapsed: boolean
  onSelectPage: (page: number) => void
  onClickQuote: () => void
}

/** 서버 OpinionSummaryResponse 중 목록 UI가 쓰는 필드만 추린 뷰 타입 */
export type Trace = {
  opinionId: number
  nickname: string
  content: string
  createdAt: string
  likeCount: number
}
