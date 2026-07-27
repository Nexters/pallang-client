'use client'

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

import { initAuthSession, signOut as signOutSession } from '@/app/_global/_queries/auth.queries'
import { hasTokens, subscribeAuthTokens } from '@/app/_global/_services/authToken.service'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  status: AuthStatus
  isAuthenticated: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let active = true
    const sync = () => {
      if (active) setStatus(hasTokens() ? 'authenticated' : 'unauthenticated')
    }
    const unsubscribe = subscribeAuthTokens(sync)
    void initAuthSession().then(sync)
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
