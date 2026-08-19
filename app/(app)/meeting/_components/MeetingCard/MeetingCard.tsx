import { Button } from '@/app/_global/_components/Button/Button'
import MeatballsMenuIcon from '@/app/_global/_components/Icon/assets/meatballs-menu.svg'
import type { GroupSummary } from '@/app/_global/_queries/group.queries'

import { formatMeetingDeadline } from '../../_services/meetingDate.service'
import { MeetingMemberAvatars } from '../MeetingMemberAvatars/MeetingMemberAvatars'

type MeetingCardProps = {
  group: GroupSummary
  /** 카드의 ··· — 더보기 시트를 연다 */
  onMore: (group: GroupSummary) => void
  /** 보러가기 — 모임 스코프 흔적 보기로 */
  onView: (group: GroupSummary) => void
}

/** 시안 3315:25409 — 343×178 흰 카드, 표지 48×72 r6, 제목 20bd, 책·저자·종료일 12, ··· 48×48, 보러가기 48 */
export function MeetingCard({ group, onMore, onView }: MeetingCardProps) {
  return (
    <article aria-label={group.name} className="flex flex-col gap-6 rounded-2xl bg-bg-default p-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="h-18 w-12 shrink-0 rounded-md bg-bg-surface bg-cover bg-center"
          style={
            group.bookCoverImageUrl
              ? { backgroundImage: `url(${group.bookCoverImageUrl})` }
              : undefined
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-title-20bd text-text-primary">{group.name}</h3>
            {/* 시안은 "모순 · 양귀자"처럼 저자를 함께 보여주지만 요약 응답(GroupSummaryResponse)에는
                저자가 없어 책 제목만 보여준다 — 백엔드에 bookAuthor 추가를 요청해야 한다. */}
            <p className="truncate text-caption-12rg text-text-tertiary">{group.bookTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-caption-12rg text-text-tertiary">
              {formatMeetingDeadline(group.endDate)}
            </span>
            <MeetingMemberAvatars groupId={group.groupId} memberCount={group.memberCount} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="더보기"
          onClick={() => {
            onMore(group)
          }}
          className="press flex size-12 shrink-0 items-center justify-center rounded-2xl bg-bg-gray"
        >
          <MeatballsMenuIcon className="text-icon-active" />
        </button>
        <Button
          variant="activated"
          className="h-12 min-w-0 flex-1 text-title-14bd"
          onClick={() => {
            onView(group)
          }}
        >
          보러가기
        </Button>
      </div>
    </article>
  )
}
