import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'

import { MeetingFormSkeleton } from '../MeetingFormSkeleton/MeetingFormSkeleton'

/** Suspense fallback — 셸(제목)은 바로 보이고 폼 자리만 골격 */
export function MeetingEditFallback() {
  return (
    <ScreenLayout title="방 설정 변경" bodyClassName="px-4 pt-4 pb-6">
      <MeetingFormSkeleton />
    </ScreenLayout>
  )
}
