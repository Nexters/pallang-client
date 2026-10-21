'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { groupQueries, type GroupSummary } from '@/app/_global/_queries/group.queries'
import { passageQueries } from '@/app/_global/_queries/passage.queries'
import { buildTraceHref } from '@/app/_shared/trace/_data/traceTarget.model'

import { type BookEntryBook, findMyGroupsForBook, resolveBookEntry } from '../_data/bookEntry.model'

/** 바로 이동하지 못하고 한 번 더 물어야 하는 경우 — 내 모임 고르기, 또는 남의 비공개 모임 안내 */
export type BookEntryOverlayState =
  | { kind: 'pickGroup'; book: BookEntryBook; groups: GroupSummary[] }
  | { kind: 'privateGroup'; book: BookEntryBook }

type UseBookEntryOptions = {
  /** 흔적 화면으로 떠나기 직전에 할 일(검색어 비우기 등). 시트나 모달만 뜨고 머무를 때는 부르지 않는다 */
  onLeave?: () => void
}

/**
 * 책 목록에서 공개 대목이 없는(또는 모르는) 책을 눌렀을 때의 흐름.
 * 공개 대목이 있으면 흔적 화면으로, 없으면 내 모임으로 보내고, 내 모임도 없으면 안내를 띄운다.
 * 목록 하나에 한 번 부르고, 띄울 것은 BookEntryOverlay에 넘긴다.
 */
export function useBookEntry({ onLeave }: UseBookEntryOptions = {}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [overlay, setOverlay] = useState<BookEntryOverlayState | null>(null)
  // 조회를 기다리는 사이 다시 누르면 같은 화면으로 두 번 이동한다 — 앞 판정이 끝날 때까지 무시한다
  const isResolvingRef = useRef(false)

  const checkPublicPassage = async (book: BookEntryBook) => {
    if (book.hasPublicPassage !== undefined) return book.hasPublicPassage
    try {
      // 흔적 화면이 처음 부르는 쿼리와 같다 — 공개 대목이 있어 그리로 가면 이 응답을 그대로 쓴다
      const pageNumbers = await queryClient.ensureInfiniteQueryData(
        passageQueries.pageNumbers(book.bookId, undefined),
      )
      return (pageNumbers.pages[0]?.data?.pageNumbers.length ?? 0) > 0
    } catch {
      // 확인하지 못하면 지금처럼 흔적 화면으로 보낸다 — 그 화면이 오류와 재시도를 보여준다
      return true
    }
  }

  const loadMyGroups = async () => {
    if (!isAuthenticated) return []
    try {
      return await queryClient.ensureQueryData(groupQueries.listAll())
    } catch {
      // 내 모임을 모르면 남의 모임 책처럼 안내한다 — 막다른 빈 화면보다는 낫다
      return []
    }
  }

  const resolveAndGo = async (book: BookEntryBook) => {
    if (isResolvingRef.current) return
    isResolvingRef.current = true
    try {
      const hasPublicPassage = await checkPublicPassage(book)
      const myGroups = hasPublicPassage
        ? []
        : findMyGroupsForBook(await loadMyGroups(), book.bookId)
      const entry = resolveBookEntry({ hasPublicPassage, myGroups })

      if (entry.kind === 'public') {
        onLeave?.()
        router.push(buildTraceHref(book.bookId))
        return
      }
      if (entry.kind === 'myGroup') {
        onLeave?.()
        router.push(buildTraceHref(book.bookId, { groupId: entry.group.groupId }))
        return
      }
      if (entry.kind === 'pickGroup') {
        setOverlay({ kind: 'pickGroup', book, groups: entry.groups })
        return
      }
      setOverlay({ kind: 'privateGroup', book })
    } finally {
      isResolvingRef.current = false
    }
  }

  return {
    /** 목록의 책을 눌렀을 때 — 판정에 조회가 끼어도 부르는 쪽은 기다릴 일이 없다 */
    enter: (book: BookEntryBook) => {
      void resolveAndGo(book)
    },
    overlay,
    closeOverlay: () => {
      setOverlay(null)
    },
  }
}
