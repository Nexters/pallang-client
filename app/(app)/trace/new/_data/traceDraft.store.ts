'use client'

import { createContext, type Dispatch } from 'react'

import type { DraftDecoration, TraceDraft, TraceDraftAction } from '../_types/traceDraft.type'

export const initialTraceDraft: TraceDraft = {
  book: null,
  source: null,
  quotedText: '',
  pageNumber: null,
  isSpoiler: false,
  decorations: [],
  content: '',
  passageId: null,
  result: null,
}

function overlaps(a: DraftDecoration, b: DraftDecoration): boolean {
  return a.startOffset < b.endOffset && b.startOffset < a.endOffset
}

export function traceDraftReducer(state: TraceDraft, action: TraceDraftAction): TraceDraft {
  switch (action.type) {
    case 'selectBook':
      // 책을 고르는 건 새 흔적의 시작이다. 직전에 저장한 흔적과의 연결을 끊는다.
      return { ...state, book: action.book, passageId: null, result: null }
    case 'fillBookDetail': {
      // 손대는 곳은 book.author와 book.pageCount 두 자리뿐이다. 다른 어떤 값도(특히 씨앗이
      // 미리 정해 준 passageId와 저장 결과인 result) 이 액션으로는 바뀌지 않는다.
      const { book } = state
      if (book === null) return state
      // 그새 다른 책으로 바뀌었으면 늦게 온 값이다 — 상태를 그대로 돌려 리렌더도 만들지 않는다.
      if (book.bookId !== action.bookId) return state
      // 이미 값이 있으면 덮지 않는다. 이 액션은 '비어 있던 자리를 메우는' 일만 한다.
      const author = book.author.trim().length > 0 ? book.author : action.author
      const pageCount = book.pageCount ?? action.pageCount
      // 메울 자리가 없으면 상태를 그대로 돌려준다 — useReducer가 같은 상태에 리렌더를 만들지
      // 않으므로, 부르는 쪽이 몇 번을 던져도 '채우기 → 리렌더 → 다시 채우기'가 성립하지 않는다.
      if (author === book.author && pageCount === book.pageCount) return state
      return { ...state, book: { ...book, author, pageCount } }
    }
    case 'setSource':
      return { ...state, source: action.source }
    case 'setQuotedText':
      return { ...state, quotedText: action.quotedText, decorations: [] }
    case 'clearQuote':
      // 대목을 다시 고르러 첫 화면(TraceSourceView)으로 돌아갈 때 쓴다.
      // 페이지·효과·병합 대상은 모두 이 대목에 매인 값이라 함께 비운다.
      return {
        ...state,
        quotedText: '',
        decorations: [],
        pageNumber: null,
        isSpoiler: false,
        passageId: null,
      }
    case 'setPageDetail':
      // 병합 대상은 '이 책 · 이 페이지 · 이 대목'에 매인 판정이다.
      // 페이지가 바뀌면 그 판정은 다른 쪽에 대한 답이라 무효다 — 비워서 ③이 다시 묻게 한다.
      return {
        ...state,
        pageNumber: action.pageNumber,
        isSpoiler: action.isSpoiler,
        passageId: null,
      }
    case 'applyDecoration':
      return {
        ...state,
        decorations: [
          ...state.decorations.filter((item) => !overlaps(item, action.decoration)),
          action.decoration,
        ].sort((a, b) => a.startOffset - b.startOffset),
      }
    case 'recolorDecoration':
      return {
        ...state,
        decorations: state.decorations.map((item) =>
          item.startOffset === action.startOffset ? { ...item, color: action.color } : item,
        ),
      }
    case 'removeDecoration':
      return {
        ...state,
        decorations: state.decorations.filter((item) => item.startOffset !== action.startOffset),
      }
    case 'setContent':
      return { ...state, content: action.content }
    case 'setMergeTarget':
      return { ...state, passageId: action.passageId }
    case 'setResult':
      return { ...state, result: action.result }
    case 'resetKeepingBook':
      return { ...initialTraceDraft, book: state.book }
    case 'reset':
      return initialTraceDraft
  }
}

export const TraceDraftContext = createContext<{
  draft: TraceDraft
  dispatch: Dispatch<TraceDraftAction>
} | null>(null)
