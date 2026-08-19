import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'
import type { Decoration, EffectType } from '@/app/_shared/trace/_data/decoration.model'

/** 초안의 책은 공용 모양 그대로다 — 책 선택 시트(_shared/book)와 같은 타입을 써야 시트가 고른 책을 그대로 담는다. */
// eslint-disable-next-line no-barrel-files/no-barrel-files -- 배럴이 아니라 이 경로를 쓰는 ~14곳의 trace/new 임포터를 건드리지 않기 위한 호환 재노출
export type { SelectedBook }

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
  /**
   * 유사 대목(중복)을 이미 물어본 조합. `책 + 대목`을 키로 삼는다(similarCheck.service).
   * 초안에 두는 이유는 묻는 자리가 단계마다 갈리기 때문이다 — ①에서 물었으면 ③에서 또 묻지 않는다.
   */
  similarCheckedKey: string | null
  result: TraceCreateResult | null
}

/** 저장이 끝난 흔적. 완료 화면이 이 값으로 흔적 보기의 좌표를 만든다 — 쪽 번호는 초안에서 온다. */
export type TraceCreateResult = {
  opinionId: number
  /** 서버가 정해 준 대목 — 합쳐졌으면 합쳐진 쪽의 id다 */
  passageId: number
  merged: boolean
}

export type TraceDraftAction =
  | { type: 'selectBook'; book: SelectedBook }
  /**
   * 이미 담긴 책의 빈 자리(저자·쪽수)만 뒤늦게 채운다. selectBook과 나누는 이유는 뜻이 달라서다 —
   * selectBook은 '새 흔적의 시작'이라 합칠 대목과 저장 결과를 지우는데, 이 경로의 책은 이미
   * 골라 둔 그 책이라 지울 것이 없다. bookId를 함께 받아, 응답이 늦게 도착하는 사이 책이
   * 바뀌었으면 아무것도 하지 않는다.
   */
  | { type: 'fillBookDetail'; bookId: number; author: string; pageCount: number }
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
  /** 이 조합은 유사 대목을 물어봤다고 표시한다. 답이 무엇이든(합치기·따로) 다시 묻지 않기 위함. */
  | { type: 'markSimilarChecked'; key: string }
  | { type: 'setResult'; result: TraceCreateResult }
  | { type: 'resetKeepingBook' }
  | { type: 'reset' }
