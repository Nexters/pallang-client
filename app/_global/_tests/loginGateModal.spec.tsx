import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginGateModal } from '@/app/_global/_components/LoginGateModal/LoginGateModal'
import { LOGIN_GATE_TITLE } from '@/app/_global/_data/loginGate.constant'

describe('LoginGateModal', () => {
  it('message가 null이면 열리지 않는다', () => {
    render(<LoginGateModal message={null} onLogin={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('message를 주면 고정 제목과 액션별 안내 문구가 함께 열린다', async () => {
    render(
      <LoginGateModal
        message="로그인하면 흔적을 남길 수 있어요"
        onLogin={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const dialog = await screen.findByRole('dialog')
    // 제목은 액션과 무관하게 고정이고, 액션별 사정은 설명 줄이 말한다
    expect(dialog).toHaveAccessibleName(LOGIN_GATE_TITLE)
    expect(dialog).toHaveAccessibleDescription('로그인하면 흔적을 남길 수 있어요')
  })

  it('로그인 버튼을 누르면 onLogin을 호출한다', async () => {
    const onLogin = vi.fn()
    render(
      <LoginGateModal
        message="로그인하면 확인 할 수 있어요!"
        onLogin={onLogin}
        onClose={vi.fn()}
      />,
    )
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: '로그인 하기' }))

    expect(onLogin).toHaveBeenCalledOnce()
  })

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <LoginGateModal
        message="로그인하면 확인 할 수 있어요!"
        onLogin={vi.fn()}
        onClose={onClose}
      />,
    )
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
