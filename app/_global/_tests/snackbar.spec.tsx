import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('message가 비어 있으면 렌더하지 않는다', () => {
    render(<Snackbar message="" onClose={vi.fn()} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('message를 보여준다', () => {
    render(<Snackbar message="영역 선택 후 효과를 입력해주세요!" onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('영역 선택 후 효과를 입력해주세요!')
  })

  it('3초 뒤 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Snackbar message="저장에 실패했어요" onClose={onClose} />)
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('부모 리렌더마다 새로운 onClose 참조가 와도 타이머는 계속된다', () => {
    const onClose1 = vi.fn()
    const { rerender } = render(<Snackbar message="테스트" onClose={onClose1} />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const onClose2 = vi.fn()
    rerender(<Snackbar message="테스트" onClose={onClose2} />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const onClose3 = vi.fn()
    rerender(<Snackbar message="테스트" onClose={onClose3} />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // 누적 3초 후 최신 onClose가 호출되어야 함
    expect(onClose1).not.toHaveBeenCalled()
    expect(onClose2).not.toHaveBeenCalled()
    expect(onClose3).toHaveBeenCalledOnce()
  })
})
