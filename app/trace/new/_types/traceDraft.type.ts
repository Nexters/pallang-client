import type { Decoration, EffectType } from '@/app/_shared/trace/_data/decoration.model'

export type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}

/** 작성 중인 초안의 효과도 흔적 보기와 같은 모양이다 — 렌더 코드를 공유하려고 _shared 타입을 그대로 쓴다. */
export type DraftEffectType = EffectType
export type DraftDecoration = Decoration

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
