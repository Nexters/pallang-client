import type { ReactNode } from 'react'

import { BookDetailFiller } from './_components/BookDetailFiller/BookDetailFiller'
import { TraceDraftProvider } from './_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from './_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from './_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceStepGuard } from './_components/TraceStepGuard/TraceStepGuard'

export default function TraceNewLayout({ children }: { children: ReactNode }) {
  return (
    <TraceDraftProvider>
      {/* 씨앗으로 들어온 책의 빈 저자·쪽수를 채운다. 단계마다 route가 갈려도 살아 있도록
          화면이 아니라 여기(초안과 같은 수명)에 둔다. */}
      <BookDetailFiller />
      <TraceOverlayProvider>
        <TraceNavProvider>
          <TraceStepGuard>{children}</TraceStepGuard>
        </TraceNavProvider>
      </TraceOverlayProvider>
    </TraceDraftProvider>
  )
}
