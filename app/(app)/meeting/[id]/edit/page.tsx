import { Suspense } from 'react'

import { MeetingEditBoundary } from '../../_components/MeetingEditBoundary/MeetingEditBoundary'
import { MeetingEditFallback } from '../../_components/MeetingEditFallback/MeetingEditFallback'

export default function MeetingEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<MeetingEditFallback />}>
      <MeetingEditBoundary params={params} />
    </Suspense>
  )
}
