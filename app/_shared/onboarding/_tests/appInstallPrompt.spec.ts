import { beforeEach, describe, expect, it } from 'vitest'

import {
  consumeAppInstallPrompt,
  markAppInstallPromptPending,
} from '../_services/appInstallPrompt.service'

describe('appInstallPrompt.service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('예약한 설치 안내는 한 번만 가져온다', () => {
    markAppInstallPromptPending()

    expect(consumeAppInstallPrompt()).toBe(true)
    expect(consumeAppInstallPrompt()).toBe(false)
  })
})
