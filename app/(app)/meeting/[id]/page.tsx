import { Suspense } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'

import { MeetingBookArea } from '../_components/MeetingBookArea/MeetingBookArea'
import { MeetingDetailBoundary } from '../_components/MeetingDetailBoundary/MeetingDetailBoundary'
import { MeetingDetailSkeleton } from '../_components/MeetingDetailSkeleton/MeetingDetailSkeleton'

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <ScreenLayout title="모임">
          <MeetingDetailSkeleton />
          <MeetingBookArea />
        </ScreenLayout>
      }
    >
      <MeetingDetailBoundary params={params} />
    </Suspense>
  )
}
