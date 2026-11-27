import { notFound } from 'next/navigation'

import { MeetingDetailView } from '../MeetingDetailView/MeetingDetailView'

export async function MeetingDetailBoundary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d+$/.test(id) || Number(id) <= 0) notFound()
  return <MeetingDetailView groupId={Number(id)} />
}
