import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'

describe('RetryMessage', () => {
  it('평소에는 다시 불러오기를 눌러 재시도한다', async () => {
    const onRetry = vi.fn()
    render(<RetryMessage message="더 불러오지 못했어요." onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('재시도가 도는 동안 진행을 드러내고 같은 요청을 두 번 보내지 않는다', async () => {
    // 이 줄이 서는 자리(isFetchNextPageError)는 재시도 중에도 참이라, loading이 없으면
    // 눌러도 화면이 그대로다 — 사용자는 눌리지 않은 것으로 읽고 계속 누른다
    const onRetry = vi.fn()
    render(<RetryMessage message="더 불러오지 못했어요." loading onRetry={onRetry} />)

    const button = screen.getByRole('button', { name: '불러오는 중…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')

    await userEvent.click(button)
    expect(onRetry).not.toHaveBeenCalled()
  })
})
