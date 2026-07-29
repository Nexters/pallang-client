import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearTokens, getAccessToken, saveTokens } from '@/app/_global/_services/authToken.service'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ value: null }),
  },
}))

describe('authToken.service 쿠키 미러링', () => {
  afterEach(async () => {
    await clearTokens()
  })

  it('saveTokens 시 accessToken을 쿠키에 미러링한다', async () => {
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    expect(getAccessToken()).toBe('access-1')
    expect(document.cookie).toContain('pallang.accessToken=access-1')
    expect(document.cookie).not.toContain('refresh-1')
  })

  it('clearTokens 시 쿠키를 제거한다', async () => {
    await saveTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    await clearTokens()
    expect(document.cookie).not.toContain('access-1')
  })
})
