import { Capacitor } from '@capacitor/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAppStoreUrl, getMobileWebPlatform } from '../_services/mobileWebPlatform.service'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
}))

function defineNavigator(patch: Partial<Navigator>) {
  const originals = new Map<string, PropertyDescriptor | undefined>()
  for (const [key, value] of Object.entries(patch)) {
    originals.set(key, Object.getOwnPropertyDescriptor(window.navigator, key))
    Object.defineProperty(window.navigator, key, { configurable: true, value })
  }
  return () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(window.navigator, key, descriptor)
      else Reflect.deleteProperty(window.navigator, key)
    }
  }
}

describe('mobileWebPlatform.service', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
  })

  it('iPhone 웹에서는 App Store를 선택한다', () => {
    const restoreNavigator = defineNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
    })

    expect(getMobileWebPlatform()).toBe('ios')
    expect(getAppStoreUrl('ios')).toContain('apps.apple.com')

    restoreNavigator()
  })

  it('Android 웹에서는 Google Play를 선택한다', () => {
    const restoreNavigator = defineNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 15)' })

    expect(getMobileWebPlatform()).toBe('android')
    expect(getAppStoreUrl('android')).toContain('play.google.com')

    restoreNavigator()
  })

  it('네이티브 앱과 데스크톱에서는 스토어 플랫폼을 고르지 않는다', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    expect(getMobileWebPlatform()).toBeNull()

    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    const restoreNavigator = defineNavigator({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })
    expect(getMobileWebPlatform()).toBeNull()
    restoreNavigator()
  })
})
