import type { RefObject } from 'react'

import type { GroupSummary } from '@/app/_global/_queries/group.queries'

import { MeetingCard } from '../MeetingCard/MeetingCard'

type MeetingListProps = {
  groups: GroupSummary[]
  onMore: (group: GroupSummary) => void
  onView: (group: GroupSummary) => void
  /** 목록 끝 감시 지점 — 보이면 다음 페이지를 받는다 */
  loadMoreRef: RefObject<HTMLLIElement | null>
}

/** 시안: 헤더 아래 16, 카드 사이 12, 좌우 16 */
export function MeetingList({ groups, onMore, onView, loadMoreRef }: MeetingListProps) {
  return (
    <ul aria-label="내 모임 목록" className="flex flex-col gap-3 px-4 pt-4 pb-6">
      {groups.map((group) => (
        <li key={group.groupId}>
          <MeetingCard group={group} onMore={onMore} onView={onView} />
        </li>
      ))}
      <li ref={loadMoreRef} aria-hidden className="h-6 w-full" />
    </ul>
  )
}
