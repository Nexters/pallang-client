import { Suspense } from 'react'

import { MeetingInviteBoundary } from '../../_components/MeetingInviteBoundary/MeetingInviteBoundary'
import { MeetingInviteFallback } from '../../_components/MeetingInviteFallback/MeetingInviteFallback'

export default function MeetingInvitePage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<MeetingInviteFallback />}>
      <MeetingInviteBoundary params={params} />
    </Suspense>
  )
}
