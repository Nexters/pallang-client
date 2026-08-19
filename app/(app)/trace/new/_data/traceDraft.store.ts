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
  similarCheckedKey: null,
  groupId: null,
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
        similarCheckedKey: null,
      }
    case 'setPageDetail': {
      // 병합 판정은 '이 책 · 이 대목'에 매인다 — 대목을 얻은 직후(①에 들어서는 순간),
      // 아직 페이지를 받기 전에 묻기 때문이다. 그래서 빈 자리를 처음 채우는 것만으로는
      // 판정을 버리지 않는다. 그러지 않으면 ①에서 '합칠게요'를 고른 답이 바로 다음 줄의
      // '다음'에서 조용히 날아간다.
      // 다만 이미 정해져 있던 페이지를 다른 값으로 고치면 얘기가 다르다 — 서버는 인접
      // 페이지(±1)에서만 후보를 찾으므로 그 판정은 다른 쪽에 대한 답이 된다. 그때만 비워
      // 다시 묻게 한다.
      const isPageReplaced = state.pageNumber !== null && state.pageNumber !== action.pageNumber
      return {
        ...state,
        pageNumber: action.pageNumber,
        isSpoiler: action.isSpoiler,
        passageId: isPageReplaced ? null : state.passageId,
        similarCheckedKey: isPageReplaced ? null : state.similarCheckedKey,
      }
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
    case 'setGroupId':
      return { ...state, groupId: action.groupId }
    case 'markSimilarChecked':
      return { ...state, similarCheckedKey: action.key }
    case 'setResult':
      return { ...state, result: action.result }
    case 'resetKeepingBook':
      // 같은 자리에서 하나 더 남기는 흐름이다 — 책과 함께 모임도 남긴다.
      // 모임을 여기서 떨구면 이어서 남긴 흔적만 조용히 전역으로 새어 나간다.
      return { ...initialTraceDraft, book: state.book, groupId: state.groupId }
    case 'reset':
      return initialTraceDraft
  }
}

export const TraceDraftContext = createContext<{
  draft: TraceDraft
  dispatch: Dispatch<TraceDraftAction>
} | null>(null)
