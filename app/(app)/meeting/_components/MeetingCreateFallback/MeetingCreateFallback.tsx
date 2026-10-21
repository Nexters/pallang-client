import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'

import { MeetingFormSkeleton } from '../MeetingFormSkeleton/MeetingFormSkeleton'

/** Suspense fallback — 셸(제목)은 바로 보이고 폼 자리만 골격 */
export function MeetingCreateFallback() {
  return (
    <ScreenLayout title="모임 만들기" bodyClassName="px-4 pt-4 pb-6">
      <MeetingFormSkeleton />
    </ScreenLayout>
  )
}
