import { beforeEach, describe, expect, it } from 'vitest'

import { hasSeenOnboarding, markOnboardingSeen } from '../_services/onboardingSeen.service'

describe('onboardingSeen.service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('저장된 기록이 없으면 안 본 상태다', () => {
    expect(hasSeenOnboarding()).toBe(false)
  })

  it('본 것으로 기록하면 이후에는 본 상태다', () => {
    markOnboardingSeen()

    expect(hasSeenOnboarding()).toBe(true)
  })
})
