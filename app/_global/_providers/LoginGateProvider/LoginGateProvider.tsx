'use client'

import { createContext, type ReactNode, useContext } from 'react'

import { LoginGateModal } from '@/app/_global/_components/LoginGateModal/LoginGateModal'
import { useLoginGateState } from '@/app/_global/_hooks/useLoginGateState'

/**
 * 로그인 상태면 action을 실행하고, 비로그인이면 로그인 유도 팝업을 띄운다.
 * message를 넘기면 그 액션에 맞는 안내 문구로, 생략하면 기본 문구로 뜬다.
 */
type RunWithLogin = (action: () => void, message?: string) => void

const LoginGateContext = createContext<RunWithLogin | null>(null)

/** 로그인이 필요한 액션은 앱 어디에나 있어 팝업과 게이트 함수를 루트 레이아웃에서 한 번만 준비한다 */
export function LoginGateProvider({ children }: { children: ReactNode }) {
  const gate = useLoginGateState()

  return (
    <LoginGateContext.Provider value={gate.runWithLogin}>
      {children}
      {gate.gateMessage !== null && (
        <LoginGateModal message={gate.gateMessage} onLogin={gate.login} onClose={gate.close} />
      )}
    </LoginGateContext.Provider>
  )
}

export function useLoginGate(): RunWithLogin {
  const context = useContext(LoginGateContext)
  if (!context) {
    throw new Error('useLoginGate는 LoginGateProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
