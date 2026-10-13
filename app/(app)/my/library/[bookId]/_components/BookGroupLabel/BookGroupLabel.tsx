'use client'

import { useQuery } from '@tanstack/react-query'

import { groupQueries } from '@/app/_global/_queries/group.queries'
import { GroupScopeLabel } from '@/app/_shared/book/_components/GroupScopeLabel/GroupScopeLabel'

/**
 * 책 상세 머리의 `모임 · 이름`.
 * 책 상세 응답에는 모임이 없고, 들어온 URL에는 groupId만 실린다 — 이름은 모임 상세에서 읽는다.
 * 모임 목록·모임 화면을 거쳐 왔으면 이미 캐시에 있다. 못 읽어도(탈퇴한 모임 등) '모임'은 남겨
 * 이 화면이 모임 범위라는 것만은 잃지 않는다.
 */
export function BookGroupLabel({ groupId }: { groupId: number }) {
  const groupQuery = useQuery(groupQueries.detail(groupId))

  return <GroupScopeLabel groupName={groupQuery.data?.data?.name ?? ''} />
}
