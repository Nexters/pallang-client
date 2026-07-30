export type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}

/** 생성 타입 DecorationRequestEffectType과 값이 같다. _apis import 금지 규칙 때문에 로컬로 둔다. */
export type DraftEffectType =
  'CIRCLE' | 'DOTTED' | 'DOUBLE_LINE' | 'HIGHLIGHT' | 'UNDERLINE' | 'WAVY'

export type DraftDecoration = {
  startOffset: number
  /** exclusive — quotedText.slice(startOffset, endOffset) */
  endOffset: number
  effectType: DraftEffectType
  color: string
}

export type TraceDraft = {
  book: SelectedBook | null
  source: 'manual' | 'photo' | null
  quotedText: string
  pageNumber: number | null
  isSpoiler: boolean
  decorations: DraftDecoration[]
  content: string
  passageId: number | null
  result: { opinionId: number; merged: boolean } | null
}

export type TraceDraftAction =
  | { type: 'selectBook'; book: SelectedBook }
  | { type: 'setSource'; source: 'manual' | 'photo' }
  | { type: 'setQuotedText'; quotedText: string }
  /** 대목을 다시 고르러 첫 화면으로 되돌아갈 때. 책과 입력 방식은 남긴다. */
  | { type: 'clearQuote' }
  | { type: 'setPageDetail'; pageNumber: number; isSpoiler: boolean }
  | { type: 'applyDecoration'; decoration: DraftDecoration }
  | { type: 'recolorDecoration'; startOffset: number; color: string }
  | { type: 'removeDecoration'; startOffset: number }
  | { type: 'setContent'; content: string }
  | { type: 'setMergeTarget'; passageId: number | null }
  | { type: 'setResult'; result: { opinionId: number; merged: boolean } }
  | { type: 'resetKeepingBook' }
  | { type: 'reset' }
