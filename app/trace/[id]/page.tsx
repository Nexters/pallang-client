import { Suspense } from 'react'

import { ReaderHighlights } from './_components/ReaderHighlights/ReaderHighlights'

type ReaderHighlightsPageProps = {
  params: Promise<{ id: string }>
}

export default function ReaderHighlightsPage({ params }: ReaderHighlightsPageProps) {
  return (
    <Suspense>
      <ReaderHighlights params={params} />
    </Suspense>
  )
}
