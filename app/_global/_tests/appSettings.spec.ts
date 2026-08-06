import { Capacitor } from '@capacitor/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { openAppSettings } from '@/app/_global/_services/appSettings.service'

const { openSettings } = vi.hoisted(() => ({ openSettings: vi.fn() }))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn() },
  registerPlugin: () => ({ openSettings }),
}))

describe('openAppSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    openSettings.mockResolvedValue(undefined)
  })

  it('네이티브에서는 설정 화면을 연다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

    await openAppSettings()

    expect(openSettings).toHaveBeenCalled()
  })

  // 브라우저에는 열 설정 화면이 없다. 호출부가 플랫폼을 따지지 않아도 되도록 여기서 흘린다.
  it('브라우저에서는 네이티브를 부르지 않는다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    await openAppSettings()

    expect(openSettings).not.toHaveBeenCalled()
  })

  // 설정을 못 열어도 안내 화면은 그대로 남아야 한다 — 사용자가 직접 찾아갈 수 있다.
  it('설정을 열지 못해도 예외를 밖으로 흘리지 않는다', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    openSettings.mockRejectedValue(new Error('no activity'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(openAppSettings()).resolves.toBeUndefined()
    expect(consoleError).toHaveBeenCalled()
  })
})
