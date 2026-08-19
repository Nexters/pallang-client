import { notFound } from 'next/navigation'

import { MeetingEditView } from '../MeetingEditView/MeetingEditView'

type MeetingEditBoundaryProps = { params: Promise<{ id: string }> }

/** 서버 컴포넌트 — params는 Suspense 안쪽에서만 푼다(PPR 셸 유지). 양의 정수가 아니면 not-found. */
export async function MeetingEditBoundary({ params }: MeetingEditBoundaryProps) {
  const { id } = await params
  if (!/^\d+$/.test(id) || Number(id) <= 0) notFound()
  const groupId = Number(id)
  // groupId가 바뀌면 화면을 갈아 끼운다 — 같은 인스턴스를 재사용하면 앞 모임에서 고치던 값(edited)이 남는다
  return <MeetingEditView key={groupId} groupId={groupId} />
}
