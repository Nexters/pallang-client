import type { ReactNode } from 'react'

import { TraceDraftProvider } from './_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from './_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from './_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceStepGuard } from './_components/TraceStepGuard/TraceStepGuard'

export default function TraceNewLayout({ children }: { children: ReactNode }) {
  return (
    <TraceDraftProvider>
      <TraceOverlayProvider>
        <TraceNavProvider>
          <TraceStepGuard>{children}</TraceStepGuard>
        </TraceNavProvider>
      </TraceOverlayProvider>
    </TraceDraftProvider>
  )
}
