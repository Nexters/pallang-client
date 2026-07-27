import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

describe('BottomSheet', () => {
  it('open이 false면 렌더하지 않는다', () => {
    render(
      <BottomSheet open={false} title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('open이면 제목과 본문을 보여준다', () => {
    render(
      <BottomSheet open title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('새로운 흔적을 어떻게 남길까요?')).toBeInTheDocument()
    expect(screen.getByText('본문')).toBeInTheDocument()
  })

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Escape 키를 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
