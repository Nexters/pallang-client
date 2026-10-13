import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { NotificationSettingsView } from '../_components/NotificationSettingsView/NotificationSettingsView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

describe('알림 설정', () => {
  it('푸시와 활동·모임 알림 토글을 모두 켜진 상태로 보여준다', () => {
    render(<NotificationSettingsView />)

    expect(screen.getByRole('heading', { name: '알림 설정' })).toBeInTheDocument()
    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(7)
    for (const toggle of switches) {
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    }
  })

  it('이름이 같은 항목도 묶음 제목으로 구분된다', () => {
    render(<NotificationSettingsView />)

    expect(screen.getByRole('switch', { name: '활동 알림 의견 및 댓글' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '모임 알림 의견 및 댓글' })).toBeInTheDocument()
  })

  it('토글을 끄면 스낵바로 알려준다', async () => {
    const user = userEvent.setup()
    render(<NotificationSettingsView />)

    const toggle = screen.getByRole('switch', { name: '활동 알림 의견 및 댓글' })
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('의견 및 댓글 알림을 비활성화했습니다.')
  })

  it('스낵바의 취소를 누르면 바꾼 토글을 되돌린다', async () => {
    const user = userEvent.setup()
    render(<NotificationSettingsView />)

    const toggle = screen.getByRole('switch', { name: '푸시 알림' })
    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
