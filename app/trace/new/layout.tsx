import type { ReactNode } from 'react'

import { TraceDraftProvider } from './_components/TraceDraftProvider/TraceDraftProvider'
import { TraceStepGuard } from './_components/TraceStepGuard/TraceStepGuard'

export default function TraceNewLayout({ children }: { children: ReactNode }) {
  return (
    <TraceDraftProvider>
      <TraceStepGuard>{children}</TraceStepGuard>
    </TraceDraftProvider>
  )
}
