export type Highlight = {
  page: number
  quotes: string[]
  isSpoiler: boolean
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
