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

export type TraceComment = {
  id: number
  nickname: string
  content: string
  createdAt: string
}

export type Trace = {
  id: number
  nickname: string
  content: string
  createdAt: string
  likeCount: number
  commentCount: number
  isSpoiler: boolean
  comments: TraceComment[]
}
