export type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}

/** 생성 타입 DecorationRequestEffectType과 값이 같다. _apis import 금지 규칙 때문에 로컬로 둔다. */
export type DraftEffectType = 'UNDERLINE' | 'WAVY' | 'HIGHLIGHT'

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
  | { type: 'setPageDetail'; pageNumber: number; isSpoiler: boolean }
  | { type: 'applyDecoration'; decoration: DraftDecoration }
  | { type: 'removeDecoration'; startOffset: number }
  | { type: 'setContent'; content: string }
  | { type: 'setMergeTarget'; passageId: number | null }
  | { type: 'setResult'; result: { opinionId: number; merged: boolean } }
  | { type: 'resetKeepingBook' }
  | { type: 'reset' }
