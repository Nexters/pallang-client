import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { markOnboardingSeen } from '@/app/_shared/onboarding/_services/onboardingSeen.service'

import { useOnboardingGate } from '../_hooks/useOnboardingGate'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
}))

describe('홈 온보딩 게이트', () => {
  beforeEach(() => {
    window.localStorage.clear()
    replace.mockClear()
  })

  it('첫 실행이면 온보딩으로 보낸다', () => {
    renderHook(() => {
      useOnboardingGate()
    })

    expect(replace).toHaveBeenCalledWith('/onboarding')
  })

  it('이미 봤으면 홈에 머무른다', () => {
    markOnboardingSeen()

    renderHook(() => {
      useOnboardingGate()
    })

    expect(replace).not.toHaveBeenCalled()
  })
})
