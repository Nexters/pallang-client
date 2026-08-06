// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const INFO_PLIST = fileURLToPath(new URL('../../../ios/App/App/Info.plist', import.meta.url))

/**
 * Capacitor 카메라 플러그인은 getPhoto 진입에서 CameraPropertyListKeys의 세 키를 모두
 * 검사하고, 하나라도 없으면 카메라를 열기 전에 reject한다(CameraTypes.swift).
 * 그래서 하나가 빠지면 권한 창도 안 뜨고 촬영이 통째로 죽는데, 웹에서는 아무 티가 나지
 * 않아 기기에서만 드러난다. 실제로 NSPhotoLibraryAddUsageDescription이 빠져 있었다.
 */
const REQUIRED_KEYS = [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
] as const

describe('iOS 카메라 권한 문구', () => {
  const plist = readFileSync(INFO_PLIST, 'utf8')

  it.each(REQUIRED_KEYS)('%s가 Info.plist에 있다', (key) => {
    expect(plist).toContain(`<key>${key}</key>`)
  })

  it('각 키에 비어 있지 않은 문구가 붙어 있다', () => {
    for (const key of REQUIRED_KEYS) {
      const value = new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`).exec(plist)?.[1]
      expect(value?.trim()).toBeTruthy()
    }
  })
})
