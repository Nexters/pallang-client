import { Suspense } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'

import { MeetingBookEditBoundary } from '../../../../_components/MeetingBookEditBoundary/MeetingBookEditBoundary'
import { MeetingFormSkeleton } from '../../../../_components/MeetingFormSkeleton/MeetingFormSkeleton'

export default function MeetingBookEditPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>
}) {
  return (
    <Suspense
      fallback={
        <ScreenLayout title="책 설정 변경" bodyClassName="px-4 pt-4 pb-6">
          <MeetingFormSkeleton />
        </ScreenLayout>
      }
    >
      <MeetingBookEditBoundary params={params} />
    </Suspense>
  )
}
