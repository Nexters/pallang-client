import { useState } from 'react'

import type { QuoteCursor } from '../_types/readerHighlights.type'

export function useHighlightViewer(
  firstPage: number | undefined,
  /** 목록 화면에서 지목해 들어온 시작 위치 — 사용자가 페이지·대목을 옮기면 그대로 덮인다 */
  initialPosition?: { page: number; cursor: QuoteCursor },
) {
  const [selectedPage, setSelectedPage] = useState<null | number>(initialPosition?.page ?? null)
  const [quoteCursor, setQuoteCursor] = useState<QuoteCursor>(initialPosition?.cursor ?? 0)
  // 해제는 대목 단위다(#49) — 한 대목을 열어도 같은 쪽의 다른 스포일러 대목은 그대로 가려 둔다.
  // 그래서 boolean 하나가 아니라 '연 적 있는 대목'을 모아 든다. 되돌아온 대목을 다시 잠그지 않으려면
  // 기억이 필요하고, 쪽을 옮기면 통째로 버려 다른 쪽의 스포일러는 다시 묻는다.
  const [revealedPassageIds, setRevealedPassageIds] = useState<ReadonlySet<number>>(() => new Set())
  const activePage = selectedPage ?? firstPage

  /** 페이지 이동의 유일한 통로 — 탭 선택도 스와이프도 여기로 모인다 */
  const openPage = (page: number, cursor: QuoteCursor) => {
    setSelectedPage(page)
    setQuoteCursor(cursor)
    setRevealedPassageIds(new Set())
  }

  return {
    activePage,
    quoteCursor,
    /** 이 대목을 연 적이 있는지 — 대목이 아직 도착하지 않았으면(undefined) 연 적 없는 것으로 본다 */
    isRevealed: (passageId: number | undefined) =>
      passageId !== undefined && revealedPassageIds.has(passageId),
    select: (page: number) => {
      openPage(page, 0)
    },
    goToPage: openPage,
    goToQuote: (index: number) => {
      setQuoteCursor(index)
    },
    reveal: (passageId: number) => {
      setRevealedPassageIds((current) => new Set(current).add(passageId))
    },
  }
}
