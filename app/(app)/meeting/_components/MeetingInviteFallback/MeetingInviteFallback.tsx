import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

import { MeetingInviteSkeleton } from '../MeetingInviteSkeleton/MeetingInviteSkeleton'

/**
 * Suspense fallback — 셸(제목)은 바로 보이고 미리보기 자리만 골격.
 * CTA 자리도 함께 잡아 둔다. 비워 두면 버튼이 나중에 끼어들며 가운데 정렬된 본문이 위로 튄다.
 */
export function MeetingInviteFallback() {
  return (
    <ScreenLayout
      title="모임 초대"
      bodyClassName="px-4 py-6"
      footer={<Skeleton className="h-[54px] flex-1 rounded-2xl" />}
    >
      <MeetingInviteSkeleton />
    </ScreenLayout>
  )
}
