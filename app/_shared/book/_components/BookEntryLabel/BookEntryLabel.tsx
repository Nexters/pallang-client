'use client'

import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { findMyGroupsForBook } from '../../_data/bookEntry.model'
import { GroupScopeLabel } from '../GroupScopeLabel/GroupScopeLabel'

type BookEntryLabelProps = {
  bookId: number
  hasPublicPassage: boolean | undefined
}

/**
 * 탐색 목록에서 공개 기록 없이 모임에서만 읽는 책을 가르는 표시(BookItem의 scopeLabel 자리).
 * 내 모임이면 `모임 · 이름`(내 서재와 같은 모양), 남의 모임이면 `비공개 모임`.
 * 공개 기록이 있거나 아직 모르는 책에는 아무것도 달지 않는다.
 */
export function BookEntryLabel({ bookId, hasPublicPassage }: BookEntryLabelProps) {
  const { status, isAuthenticated } = useAuth()
  const isGroupOnly = hasPublicPassage === false
  // 목록의 라벨이 모두 같은 쿼리를 본다 — 요청은 한 번이다
  const myGroupsQuery = useQuery({
    ...groupQueries.listAll(),
    enabled: isGroupOnly && isAuthenticated,
  })

  if (!isGroupOnly) return null
  // 내 모임을 알기 전에는 자리만 잡아 둔다. '비공개 모임'으로 먼저 섰다가 '모임 · 이름'으로 바뀌면 글자가 튀고,
  // 비워 두면 라벨 한 줄(21px)만큼 행이 표지 높이(120px)를 넘어 아래 행들이 밀린다
  if (status === 'loading' || (isAuthenticated && myGroupsQuery.isPending)) {
    return <GroupScopeLabel scope="비공개 모임" groupName="" className="invisible" />
  }

  const [first, ...rest] = findMyGroupsForBook(myGroupsQuery.data ?? [], bookId)
  if (!first) return <GroupScopeLabel scope="비공개 모임" groupName="" />
  return <GroupScopeLabel groupName={first.name} moreCount={rest.length} />
}
