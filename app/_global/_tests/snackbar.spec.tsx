import { fireEvent, render, screen } from '@testing-library/react'
import { act, StrictMode, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

function SnackbarHarness() {
  const [message, setMessage] = useState('')

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage('영역 선택 후 효과를 입력해주세요!')
        }}
      >
        효과
      </button>
      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </>
  )
}

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

  it('message가 비면 곧바로 사라지지 않고 문구를 유지한 채 퇴장한다', () => {
    const { rerender } = render(<Snackbar message="저장했어요" onClose={vi.fn()} />)

    rerender(<Snackbar message="" onClose={vi.fn()} />)

    // 퇴장 전환이 도는 동안에는 아직 붙어 있고, 문구도 비지 않는다
    expect(screen.getByRole('status')).toHaveTextContent('저장했어요')

    act(() => {
      vi.advanceTimersByTime(MOTION_DURATION.fast)
    })

    expect(screen.queryByRole('status')).toBeNull()
  })
})

// 실제 화면은 토스트를 빈 문구로 계속 붙여 둔다. 그 사이 useExitTransition의 퇴장 타이머가
// 발화하면서 남기던 잔여 상태 업데이트가 첫 열림을 덮어써, 꾸미기 화면에 들어와 아무것도
// 선택하지 않고 효과를 누른 '첫' 토스트만 뜨지 않았다.
describe('Snackbar - 마운트 후 시간이 지나 처음 열릴 때', () => {
  it('빈 상태로 머물렀다가 처음 띄워도 보인다', async () => {
    render(
      <StrictMode>
        <SnackbarHarness />
      </StrictMode>,
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, MOTION_DURATION.fast * 2))
    })

    fireEvent.click(screen.getByRole('button', { name: '효과' }))

    expect(screen.getByRole('status')).toHaveTextContent('영역 선택 후 효과를 입력해주세요!')
  })
})
