import { notFound } from 'next/navigation'

import { NoticeDetailView } from '../NoticeDetailView/NoticeDetailView'

type NoticeDetailBoundaryProps = {
  params: Promise<{ noticeId: string }>
}

/**
 * 서버 컴포넌트 — 상세 화면의 요청 시점 경계.
 * params를 여기서만 읽으므로(page는 Suspense로 감싸기만 한다) cacheComponents 환경에서
 * 페이지 셸은 그대로 프리렌더되고 이 안쪽만 요청 시점에 스트리밍된다.
 */
export async function NoticeDetailBoundary({ params }: NoticeDetailBoundaryProps) {
  const { noticeId } = await params
  const parsed = Number(noticeId)

  // 셸이 이미 200으로 나간 뒤라 not-found 화면은 뜨지만 응답 코드는 200이다.
  // 404 상태 코드까지 필요해지면 params를 Suspense 바깥에서 읽어야 하고 셸 프리렌더를 잃는다.
  if (!Number.isInteger(parsed)) notFound()

  return <NoticeDetailView noticeId={parsed} />
}
