import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TraceHeader } from '../_components/TraceHeader/TraceHeader'

describe('흔적 헤더', () => {
  it('모임 스코프면 제목 앞에 "모임" 배지를 붙인다', () => {
    render(<TraceHeader title="프랑켄슈타인" onBack={vi.fn()} scopeLabel="모임" />)

    expect(screen.getByText('모임')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '프랑켄슈타인' })).toBeInTheDocument()
  })

  it('스코프가 없으면 배지가 없다', () => {
    render(<TraceHeader title="프랑켄슈타인" onBack={vi.fn()} />)

    expect(screen.queryByText('모임')).not.toBeInTheDocument()
  })
})
