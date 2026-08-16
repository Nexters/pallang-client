'use client'

import { useRef, useState } from 'react'

import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

import type { PageNav } from '../_types/readerHighlights.type'

/** 헤더 쪽 선택기(PagePicker)의 상태 — 목록 이어 불러오기와 목록에 담을 쪽을 정한다.
    쪽 목록은 열려 있는 동안 갈리면 안 된다: 고른 순간 현재 쪽을 따라가면 퇴장 전환 중에
    줄이 통째로 갈려 툭 끊겨 보인다. 그래서 기준 쪽은 '열 때만' 갱신하고,
    닫히는 동안(duration-fast)에는 방금 고른 줄이 그 자리에 남는다. */
export function usePagePicker({ pages, activePage, onLoadMorePages }: PageNav) {
  const popupRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: popupRef,
    enabled: onLoadMorePages !== undefined,
    onLoadMore: () => {
      onLoadMorePages?.()
    },
  })

  const currentPage = activePage ?? pages[0]
  const [listAnchorPage, setListAnchorPage] = useState(currentPage)

  return {
    /** 열린 목록 상자 — sentinel을 관찰하는 스크롤 기준이다 */
    popupRef,
    /** 목록 끝 sentinel — 보이면 다음 쪽 묶음을 이어 붙인다 */
    loadMoreRef,
    currentPage,
    /** 현재 쪽을 뺀 나머지 — 비어 있으면 펼칠 것이 없어 알약만 세운다 */
    otherPages: pages.filter((page) => page !== currentPage),
    /** 열린 목록에 담을 쪽 — 현재 쪽은 목록 맨 위에 트리거로 이미 서 있다 */
    listPages: pages.filter((page) => page !== listAnchorPage),
    /** 목록을 새로 세울 때만 기준 쪽을 맞춘다 — 닫는 쪽에서 건드리면 퇴장 중에 줄이 갈린다 */
    syncListAnchor: (nextOpen: boolean) => {
      if (nextOpen) setListAnchorPage(currentPage)
    },
  }
}
