import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TabBar } from '@/app/_global/_components/TabBar/TabBar'

describe('TabBar 흔적 남기기', () => {
  it('게이트를 받으면 링크 대신 버튼으로 그린다', () => {
    const onTraceClick = vi.fn()
    render(<TabBar onTraceClick={onTraceClick} />)

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))

    expect(onTraceClick).toHaveBeenCalledOnce()
  })

  // 프리페치가 늦으면 이동이 한 박자 걸린다. 그동안 아무 반응이 없으면 사용자가 또 누른다.
  it('이동 중에는 처리 중으로 알리고 다시 눌리지 않는다', () => {
    const onTraceClick = vi.fn()
    render(<TabBar isTracePending onTraceClick={onTraceClick} />)

    const button = screen.getByRole('button', { name: '흔적 남기기' })
    expect(button).toHaveAttribute('aria-busy', 'true')

    fireEvent.click(button)

    expect(onTraceClick).not.toHaveBeenCalled()
  })
})
