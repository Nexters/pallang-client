'use client'

import { useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { initAuthSession, signOut as signOutSession } from '@/app/_global/_queries/auth.queries'
import { hasTokens, subscribeAuthTokens } from '@/app/_global/_services/authToken.service'
import { hideSplashScreen } from '@/app/_global/_services/splashScreen.service'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const prevStatusRef = useRef<AuthStatus>('loading')

  // 세션 만료 처리: 로그인 상태였다가 풀리면(refresh 실패·로그아웃) 로그인 화면으로 보낸다.
  // 처음부터 비로그인인 사용자는 대상이 아니다(공개 페이지 탐색 허용).
  useEffect(() => {
    if (prevStatusRef.current === 'authenticated' && status === 'unauthenticated') {
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
    // 초기화 실패 시에도 스플래시는 반드시 내린다(무한 스플래시 방지).
    void initAuthSession().then(sync).finally(hideSplashScreen)
    return () => {
      active = false
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
