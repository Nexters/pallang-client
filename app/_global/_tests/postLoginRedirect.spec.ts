import { beforeEach, describe, expect, it } from 'vitest'

import { HOME_PATH, SIGN_UP_TERMS_PATH } from '@/app/_global/_data/auth.constant'
import {
  clearPostLoginReturnPath,
  markPostLoginReturnPath,
  resolvePostLoginPath,
} from '@/app/_global/_services/postLoginRedirect.service'

const RETURN_PATH_KEY = 'pallang.postLoginReturnPath'
const returningUser = { termsAgreed: true, hasCompletedOnboarding: true }
const newUser = { termsAgreed: false, hasCompletedOnboarding: false }

describe('로그인 후 이동 경로', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('심어 둔 복귀 경로는 한 번만 쓰인다', () => {
    markPostLoginReturnPath('/meeting/invite/abc123')

    expect(resolvePostLoginPath(returningUser)).toBe('/meeting/invite/abc123')
    // 남겨 두면 한참 뒤의 로그인까지 그때 그 화면으로 끌려간다
    expect(resolvePostLoginPath(returningUser)).toBe(HOME_PATH)
  })

  it('심어 둔 게 없으면 홈으로 간다', () => {
    expect(resolvePostLoginPath(returningUser)).toBe(HOME_PATH)
  })

  it('앱 밖으로 나가는 경로는 심지 않는다', () => {
    // `//evil.example.com`은 브라우저가 프로토콜 상대 URL(외부 도메인)로 읽는다 — open redirect
    markPostLoginReturnPath('//evil.example.com')
    expect(window.sessionStorage.getItem(RETURN_PATH_KEY)).toBeNull()
    expect(resolvePostLoginPath(returningUser)).toBe(HOME_PATH)

    markPostLoginReturnPath('https://evil.example.com')
    expect(window.sessionStorage.getItem(RETURN_PATH_KEY)).toBeNull()
    expect(resolvePostLoginPath(returningUser)).toBe(HOME_PATH)
  })

  it('약관 미동의는 복귀 경로보다 앞선다 — 그리고 그 경로를 쓰지 않고 남긴다', () => {
    markPostLoginReturnPath('/meeting/invite/abc123')

    expect(resolvePostLoginPath(newUser)).toBe(SIGN_UP_TERMS_PATH)
    // 가입 절차 도중에 소비했다면 여기서 홈이 나온다
    expect(resolvePostLoginPath(returningUser)).toBe('/meeting/invite/abc123')
  })

  it('게이트를 지나지 않은 액션은 심어 둔 자리를 걷어낸다', () => {
    markPostLoginReturnPath('/meeting/invite/abc123')
    clearPostLoginReturnPath()

    expect(resolvePostLoginPath(returningUser)).toBe(HOME_PATH)
  })
})
