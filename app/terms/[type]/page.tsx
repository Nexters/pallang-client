import { notFound } from 'next/navigation'

import { isPolicySlug, POLICY_META_BY_SLUG } from '@/app/_shared/terms/_data/policy.constant'

import { PolicyDetailContent } from './_components/PolicyDetailContent/PolicyDetailContent'

type PolicyDetailPageProps = {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return [{ type: 'privacy' }, { type: 'service' }]
}

export default async function PolicyDetailPage({ params }: PolicyDetailPageProps) {
  const { type } = await params

  if (!isPolicySlug(type)) notFound()

  return <PolicyDetailContent policy={POLICY_META_BY_SLUG[type]} />
}
