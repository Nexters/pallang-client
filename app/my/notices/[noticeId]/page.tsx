import { notFound } from 'next/navigation'

import { NoticeDetailView } from './_components/NoticeDetailView/NoticeDetailView'

type NoticeDetailPageProps = {
  params: Promise<{ noticeId: string }>
}

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { noticeId } = await params
  const parsed = Number(noticeId)

  if (!Number.isInteger(parsed)) notFound()

  return <NoticeDetailView noticeId={parsed} />
}
