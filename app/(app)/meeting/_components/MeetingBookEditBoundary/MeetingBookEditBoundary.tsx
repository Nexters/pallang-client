import { notFound } from 'next/navigation'

import { MeetingBookEditView } from '../MeetingBookEditView/MeetingBookEditView'

export async function MeetingBookEditBoundary({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>
}) {
  const { id, entryId } = await params
  if (!/^\d+$/.test(id) || !/^\d+$/.test(entryId) || Number(id) <= 0 || Number(entryId) <= 0)
    notFound()
  return <MeetingBookEditView groupId={Number(id)} entryId={Number(entryId)} />
}
