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

/**
 * 지금 초안에 담긴 대목을 어디서 얻었는지.
 * - `photo` 카메라·OCR · `manual` 직접 입력 — 대목만 얻고 페이지·꾸밈은 그 뒤 단계에서 채운다
 * - `passage` 흔적 보기 화면이 씨앗으로 넘긴 기존 대목 — 페이지·스포일러·꾸밈·합칠 대목까지 함께 온다.
 *   이 경우 ①에서 받을 것이 의견 하나뿐이라 ②·③을 건너뛰고 ①이 곧 저장 화면이 된다.
 */
export type TraceQuoteSource = 'manual' | 'passage' | 'photo'

export type TraceDraft = {
  book: SelectedBook | null
  source: TraceQuoteSource | null
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
  | { type: 'setSource'; source: TraceQuoteSource }
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
