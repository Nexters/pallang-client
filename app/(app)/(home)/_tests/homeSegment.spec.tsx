import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HomeSegment } from '../_components/HomeSegment/HomeSegment'

describe('HomeSegment', () => {
  it('선택 상태를 radio 속성으로 표현한다', () => {
    render(<HomeSegment selected>내 의견</HomeSegment>)

    expect(screen.getByRole('radio', { name: '내 의견' })).toHaveAttribute('aria-checked', 'true')
  })

  it('클릭하면 onClick을 호출한다', async () => {
    const onClick = vi.fn()
    render(<HomeSegment onClick={onClick}>내 의견</HomeSegment>)

    await userEvent.click(screen.getByRole('radio', { name: '내 의견' }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
