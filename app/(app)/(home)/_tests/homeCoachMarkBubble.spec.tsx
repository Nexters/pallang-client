import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HomeCoachMarkBubble } from '../_components/HomeCoachMarkBubble/HomeCoachMarkBubble'

describe('홈 코치마크 말풍선', () => {
  it('안내 문구와 현재 단계를 보여주고 액션을 실행한다', async () => {
    const handleAction = vi.fn()

    render(
      <HomeCoachMarkBubble
        actionLabel="다음"
        currentStep={1}
        totalSteps={3}
        onAction={handleAction}
      >
        {'+ 버튼을 클릭 해 현재 읽고 있거나,\n완독한 책에 의견을 남길 수 있어요.'}
      </HomeCoachMarkBubble>,
    )

    expect(screen.getByText(/\+ 버튼을 클릭 해 현재 읽고 있거나,/)).toBeInTheDocument()
    expect(screen.getByText(/완독한 책에 의견을 남길 수 있어요./)).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))

    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('마지막 단계 액션 라벨과 꼬리 위치를 지정할 수 있다', () => {
    const handleAction = vi.fn()

    const { container } = render(
      <HomeCoachMarkBubble
        actionLabel="확인"
        currentStep={3}
        tailLeft={82}
        totalSteps={3}
        onAction={handleAction}
      >
        탐색에서 확인할 수 있어요.
      </HomeCoachMarkBubble>,
    )

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toHaveStyle({ marginLeft: '82px' })
  })
})
