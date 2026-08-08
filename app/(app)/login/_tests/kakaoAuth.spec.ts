// 카카오 네이티브 인증 서비스 검증 — 액세스 토큰 전달, 빈 응답 실패, 취소 판별.
// 취소 판별이 틀리면 사용자가 스스로 닫았을 때 실패 스낵바가 뜬다.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authorizeWithKakao, isKakaoAuthCancel } from '../_services/kakaoAuth.service'

const { login } = vi.hoisted(() => ({ login: vi.fn() }))

vi.mock('@capacitor/core', () => ({
  registerPlugin: () => ({ login }),
}))

describe('authorizeWithKakao', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('네이티브가 돌려준 액세스 토큰을 그대로 반환한다', async () => {
    login.mockResolvedValue({ accessToken: 'kakao-access' })

    await expect(authorizeWithKakao()).resolves.toBe('kakao-access')
  })

  it('응답에 액세스 토큰이 없으면 실패한다', async () => {
    login.mockResolvedValue({ accessToken: '' })

    await expect(authorizeWithKakao()).rejects.toThrow('카카오 응답에 액세스 토큰이 없습니다.')
  })
})

describe('isKakaoAuthCancel', () => {
  it('네이티브 취소 코드를 취소로 판별한다', () => {
    // Capacitor는 call.reject(message, code)의 code를 에러의 code 프로퍼티로 내려준다.
    expect(isKakaoAuthCancel({ code: 'KAKAO_LOGIN_CANCELLED' })).toBe(true)
  })

  it('그 밖의 실패는 취소로 보지 않는다', () => {
    expect(isKakaoAuthCancel({ code: 'UNAVAILABLE' })).toBe(false)
    expect(isKakaoAuthCancel(new Error('network down'))).toBe(false)
    expect(isKakaoAuthCancel(null)).toBe(false)
  })
})
