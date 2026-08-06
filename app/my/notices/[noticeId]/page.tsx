import { Suspense } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'

import { NoticeDetailBoundary } from './_components/NoticeDetailBoundary/NoticeDetailBoundary'
import { NoticeDetailSkeleton } from './_components/NoticeDetailSkeleton/NoticeDetailSkeleton'

type NoticeDetailPageProps = {
  params: Promise<{ noticeId: string }>
}

export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  // params 접근은 Suspense 안쪽(NoticeDetailBoundary)으로 미룬다 — 셸은 프리렌더되고 본문만 스트리밍된다.
  // fallback을 비우면 그 셸이 빈 채로 나가므로, 도착할 화면과 같은 셸에 골격을 실어 보낸다
  return (
    <Suspense
      fallback={
        <ScreenLayout title="공지사항" bodyClassName="px-4">
          <NoticeDetailSkeleton />
        </ScreenLayout>
      }
    >
      <NoticeDetailBoundary params={params} />
    </Suspense>
  )
}
