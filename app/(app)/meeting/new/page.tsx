import { Suspense } from 'react'

import { MeetingCreateBoundary } from '../_components/MeetingCreateBoundary/MeetingCreateBoundary'
import { MeetingCreateFallback } from '../_components/MeetingCreateFallback/MeetingCreateFallback'

export default function MeetingNewPage() {
  // 미리 채울 책은 클라이언트에서 읽는다(MeetingCreateBoundary). 이 폴백은 URL 직접 로드가 하이드레이션될 때까지만 보인다
  return (
    <Suspense fallback={<MeetingCreateFallback />}>
      <MeetingCreateBoundary />
    </Suspense>
  )
}
