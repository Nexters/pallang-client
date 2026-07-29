import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

const options = [
  { value: 'no', label: '없어요' },
  { value: 'yes', label: '있어요' },
] as const

describe('SegmentedControl', () => {
  it('선택된 항목만 aria-checked가 true다', () => {
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '없어요' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '있어요' })).toHaveAttribute('aria-checked', 'false')
  })

  it('다른 항목을 누르면 그 값으로 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '있어요' }))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('이미 선택된 항목을 눌러도 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '없어요' }))
    expect(onChange).toHaveBeenCalledWith('no')
  })
})
