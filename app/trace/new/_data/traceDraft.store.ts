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
      return { ...state, book: action.book }
    case 'setSource':
      return { ...state, source: action.source }
    case 'setQuotedText':
      return { ...state, quotedText: action.quotedText, decorations: [] }
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
