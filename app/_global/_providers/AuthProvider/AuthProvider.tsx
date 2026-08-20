'use client'

import { useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const prevStatusRef = useRef<AuthStatus>('loading')
  // 스스로 누른 로그아웃인지 표시한다. 토큰이 비는 모습만 보면 만료와 구분되지 않는다.
  const isManualSignOutRef = useRef(false)

  // 세션 만료 처리: 로그인 상태였다가 풀리면(refresh 실패) 로그인 화면으로 보낸다.
  // 처음부터 비로그인인 사용자는 대상이 아니다(공개 페이지 탐색 허용).
  // 토큰이 비어도 로그인 화면으로 가로채지 않는 두 경우:
  //  - 회원 탈퇴 — 탈퇴 흐름이 비로그인 마이페이지로 보내 거기서 완료 스낵바를 띄운다.
  //  - 사용자가 직접 누른 로그아웃 — 만료와 달리 사용자가 원한 결과라, 보던 화면(마이페이지)에
  //    그대로 두고 비로그인 상태로만 바꾼다. 로그인 화면으로 되돌리면 나가려는 사람을 붙잡는 꼴이다.
  useEffect(() => {
    if (prevStatusRef.current === 'authenticated' && status === 'unauthenticated') {
      const isIntended = isManualSignOutRef.current || hasPendingWithdrawalNotice()
      // 이번 전환에서만 유효한 표시다. 남겨두면 다음 만료까지 삼킨다.
      isManualSignOutRef.current = false
      if (!isIntended) router.replace(LOGIN_PATH)
    }
    prevStatusRef.current = status
  }, [status, router])

  useEffect(() => {
    let active = true
    const sync = () => {
      if (active) setStatus(hasTokens() ? 'authenticated' : 'unauthenticated')
    }
    const unsubscribe = subscribeAuthTokens(sync)
    void initAuthSession()
      // 초기화가 실패해도 저장된 토큰 기준으로 상태를 확정한다. 여기서 sync를 건너뛰면
      // status가 'loading'에 머물러 화면이 영원히 골격으로 남는다.
      .catch((error: unknown) => {
        console.warn('인증 초기화 실패 — 저장된 토큰 기준으로 진행한다', error)
      })
      // 네이티브 스플래시를 먼저 걷고(같은 그림의 웹 스플래시가 아래에 온전히 남아 이음새가 없다),
      // 그다음 sync가 status를 바꿔 웹 스플래시 페이드아웃을 시작한다. 순서를 바꾸면 두 겹이
      // 동시에 사라지며 전환이 끊겨 보인다(#345). hideSplashScreen은 내부에서 실패를 삼키므로
      // 네이티브가 없는 웹에서도 sync 도달이 보장된다. 응답이 영영 오지 않는 경우의 상한은
      // capacitor.config.ts의 launchShowDuration이 네이티브에서 맡는다.
      .then(() => hideSplashScreen())
      .then(sync)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  // 토큰을 비우기 전에 표시해둔다 — 토큰 구독이 동기로 상태를 바꾸므로 뒤에 두면 늦는다.
  const signOut = useCallback(async () => {
    isManualSignOutRef.current = true
    try {
      await signOutSession()
    } catch (error) {
      // 토큰이 남아 상태가 안 바뀌면 표시만 남아 다음 만료를 삼킨다
      isManualSignOutRef.current = false
      throw error
    }
  }, [])

  const value: AuthContextValue = {
    status,
    isAuthenticated: status === 'authenticated',
    signOut,
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
