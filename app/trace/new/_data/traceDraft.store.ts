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
    case 'setSource':
      return { ...state, source: action.source }
    case 'setQuotedText':
      return { ...state, quotedText: action.quotedText, decorations: [] }
    case 'clearQuote':
      // BookPicker는 book이 있고 quotedText가 비어 있을 때 방식 선택 시트를 연다.
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
      return { ...state, pageNumber: action.pageNumber, isSpoiler: action.isSpoiler }
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
