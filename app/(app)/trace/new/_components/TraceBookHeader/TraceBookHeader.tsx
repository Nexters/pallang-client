'use client'

import { useState } from 'react'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { BookSearchSheet } from '../BookSearchSheet/BookSearchSheet'
import { SelectedBookCard } from '../SelectedBookCard/SelectedBookCard'

/**
 * ①·② 상단에 붙는 책 줄. 시안(3077:15701 · 3082:36454)에서 단계 표시 바로 아래,
 * 흰 영역 안에 놓인다 — 지금 쓰는 흔적이 어느 책에 붙는지를 두 화면 내내 보여준다.
 *
 * **책이 이미 정해진 경우에만 나온다.** 평소 경로에서 책은 ③에서 고르므로 ①·②에서는
 * 보여줄 책이 없고, 그 자리에 빈 카드를 두면 "아직 고른 책이 없어요"가 두 화면 내내 붙어 있게
 * 된다. 시안이 책을 그려 둔 것은 책 상세에서 책을 물고 들어온 경우다.
 *
 * 카드를 누르면 책 검색 시트가 올라온다. 시트를 여는 상태와 뒤로가기 처리를 여기 가둬,
 * 부모 화면은 "상단에 책 줄이 있다"만 알면 되게 한다.
 */
export function TraceBookHeader() {
  const { draft, dispatch } = useTraceDraft()
  const [sheetOpen, setSheetOpen] = useState(false)

  // 시트가 떠 있는 동안에는 뒤로가기가 플로우를 나가는 대신 시트만 닫는다(③과 같은 처리)
  useOverlayBackGuard(sheetOpen, () => {
    setSheetOpen(false)
  })

  if (!draft.book) return null

  return (
    <div className="px-4 pb-3.5">
      <SelectedBookCard
        affordance="card"
        book={draft.book}
        onEdit={() => {
          setSheetOpen(true)
        }}
      />
      <BookSearchSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
        }}
        onSelect={(book) => {
          dispatch({ type: 'selectBook', book })
          setSheetOpen(false)
        }}
      />
    </div>
  )
}
