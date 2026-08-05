import { beforeEach, describe, expect, it, vi } from 'vitest'

import { withdrawAccount } from '@/app/_global/_queries/user.queries'
import {
  consumeWithdrawalNotice,
  hasPendingWithdrawalNotice,
} from '@/app/_global/_services/withdrawal.service'

const { clearTokensMock, withdrawMock } = vi.hoisted(() => ({
  clearTokensMock: vi.fn(),
  withdrawMock: vi.fn(),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: vi.fn(),
  getMyOpinions: vi.fn(),
  modifyNickname: vi.fn(),
  modifyProfileImage: vi.fn(),
  withdraw: withdrawMock,
}))

vi.mock('@/app/_global/_services/authToken.service', () => ({
  clearTokens: clearTokensMock,
}))

describe('회원 탈퇴 확정 흐름(withdrawAccount)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    withdrawMock.mockResolvedValue({})
    clearTokensMock.mockResolvedValue(undefined)
  })

  it('서버 탈퇴가 성공하면 완료 플래그를 세운 뒤 토큰을 정리한다', async () => {
    // 토큰이 비는 순간 AuthProvider가 세션 만료 리다이렉트를 판단하므로,
    // 그 시점에 이미 플래그가 서 있어야 한다 — 순서를 함께 잠근다.
    clearTokensMock.mockImplementation(() => {
      expect(hasPendingWithdrawalNotice()).toBe(true)
      return Promise.resolve()
    })

    await withdrawAccount()

    expect(withdrawMock).toHaveBeenCalledTimes(1)
    expect(clearTokensMock).toHaveBeenCalledTimes(1)
  })

  it('완료 알림은 마이페이지 도착 시 1회만 소비된다', async () => {
    await withdrawAccount()

    expect(consumeWithdrawalNotice()).toBe(true)
    expect(consumeWithdrawalNotice()).toBe(false)
  })

  it('서버 탈퇴가 실패하면 토큰을 건드리지 않는다 — 세션이 살아야 재시도할 수 있다', async () => {
    withdrawMock.mockRejectedValue(new Error('server down'))

    await expect(withdrawAccount()).rejects.toThrow('server down')

    expect(clearTokensMock).not.toHaveBeenCalled()
    expect(hasPendingWithdrawalNotice()).toBe(false)
    expect(consumeWithdrawalNotice()).toBe(false)
  })
})
