import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PeekSheet } from '@/app/_global/_components/PeekSheet/PeekSheet'
import { usePeekSheet } from '@/app/_global/_hooks/usePeekSheet'

function ExpandTrigger() {
  const { expand } = usePeekSheet()
  return (
    <button type="button" onClick={expand}>
      3개의 의견
    </button>
  )
}

const peek = {
  peekTop: 400,
  expandedTop: 100,
}

describe('PeekSheet', () => {
  it('손잡이와 본문을 그리고 처음엔 접혀 있다', () => {
    render(
      <PeekSheet {...peek}>
        <p>의견 목록</p>
      </PeekSheet>,
    )
    expect(screen.getByRole('button', { name: '시트 펼치기' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByText('의견 목록')).toBeInTheDocument()
  })

  it('손잡이를 누르면 스스로 펼친다', async () => {
    render(
      <PeekSheet {...peek}>
        <p>본문</p>
      </PeekSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: '시트 펼치기' }))
    expect(screen.getByRole('button', { name: '시트 접기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('본문이 expand를 부르면 펼친다', async () => {
    render(
      <PeekSheet {...peek}>
        <ExpandTrigger />
      </PeekSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: '3개의 의견' }))
    expect(screen.getByRole('button', { name: '시트 접기' })).toBeInTheDocument()
  })

  it('defaultExpanded면 처음부터 펼쳐 있다', () => {
    render(
      <PeekSheet {...peek} defaultExpanded>
        <p>본문</p>
      </PeekSheet>,
    )
    expect(screen.getByRole('button', { name: '시트 접기' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('다이얼로그가 아니다', () => {
    render(
      <PeekSheet {...peek}>
        <p>본문</p>
      </PeekSheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('BottomSheet와 같은 어두운 패널 표면을 쓴다', () => {
    const { container } = render(
      <PeekSheet {...peek} tone="dark">
        <p>본문</p>
      </PeekSheet>,
    )
    expect(container.firstChild).toHaveClass('rounded-t-4xl', 'bg-bg-dark')
  })
})
