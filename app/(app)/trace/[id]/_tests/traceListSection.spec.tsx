import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TraceListSection } from '../_components/TraceListSection/TraceListSection'

vi.mock('@/app/_global/_hooks/usePeekSheet', () => ({
  usePeekSheet: () => ({ expand: vi.fn() }),
}))

describe('TraceListSection', () => {
  it('손잡이는 그리지 않는다 — 시트 크롬은 PeekSheet의 일이다', () => {
    render(
      <TraceListSection
        traces={[]}
        traceCount={3}
        isMasked={false}
        sortType="LATEST"
        onChangeSort={vi.fn()}
        onOpenComments={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: '시트 펼치기' })).toBeNull()
    expect(screen.queryByRole('button', { name: '의견 목록 펼치기' })).toBeNull()
    expect(screen.getByRole('button', { name: '3개의 의견' })).toBeInTheDocument()
  })
})
