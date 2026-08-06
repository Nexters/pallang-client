'use client'

import { useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { initAuthSession, signOut as signOutSession } from '@/app/_global/_queries/auth.queries'
import { hasTokens, subscribeAuthTokens } from '@/app/_global/_services/authToken.service'
import { hideSplashScreen } from '@/app/_global/_services/splashScreen.service'
import { hasPendingWithdrawalNotice } from '@/app/_global/_services/withdrawal.service'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** 인증 초기화가 응답 없이 매달릴 때 스플래시를 강제로 내리는 시점 */
const SPLASH_FALLBACK_MS = 5000

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const prevStatusRef = useRef<AuthStatus>('loading')

  // 세션 만료 처리: 로그인 상태였다가 풀리면(refresh 실패·로그아웃) 로그인 화면으로 보낸다.
  // 처음부터 비로그인인 사용자는 대상이 아니다(공개 페이지 탐색 허용).
  // 회원 탈퇴로 토큰이 비었을 때는 예외다 — 탈퇴 흐름이 비로그인 마이페이지로 보내고
  // 거기서 완료 스낵바를 띄우므로, 로그인 화면으로 가로채지 않는다.
  useEffect(() => {
    if (
      prevStatusRef.current === 'authenticated' &&
      status === 'unauthenticated' &&
      !hasPendingWithdrawalNotice()
    ) {
      router.replace(LOGIN_PATH)
    }
    prevStatusRef.current = status
  }, [status, router])

  useEffect(() => {
    let active = true
    const sync = () => {
      if (active) setStatus(hasTokens() ? 'authenticated' : 'unauthenticated')
    }
    const unsubscribe = subscribeAuthTokens(sync)
    // 초기화가 실패해도(finally), 응답이 영영 오지 않아도(타이머) 스플래시는 반드시 내린다.
    // launchAutoHide: false라 여기서 안 내리면 스플래시가 그대로 남아 "앱 실행 불가"로 보인다.
    const splashTimer = setTimeout(() => void hideSplashScreen(), SPLASH_FALLBACK_MS)
    void initAuthSession()
      // 초기화가 실패해도 저장된 토큰 기준으로 상태를 확정한다. 여기서 sync를 건너뛰면
      // status가 'loading'에 머물러 화면이 영원히 골격으로 남는다.
      .catch((error: unknown) => {
        console.warn('인증 초기화 실패 — 저장된 토큰 기준으로 진행한다', error)
      })
      .then(sync)
      .finally(() => {
        clearTimeout(splashTimer)
        void hideSplashScreen()
      })
    return () => {
      active = false
      clearTimeout(splashTimer)
      unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    status,
    isAuthenticated: status === 'authenticated',
    signOut: signOutSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
