'use client'

import { createContext, type ReactNode, useContext } from 'react'

import { useLoginGateState } from '../../_hooks/useLoginGateState'
import { LoginGateModal } from '../LoginGateModal/LoginGateModal'

/** 로그인 상태면 action을 실행하고, 비로그인이면 로그인 유도 팝업을 띄운다 */
type RunWithLogin = (action: () => void) => void

const LoginGateContext = createContext<RunWithLogin | null>(null)

/** 흔적 보기 트리 전체가 로그인 게이트를 쓰므로 팝업과 게이트 함수를 이 자리에서 한 번만 준비한다 */
export function LoginGateProvider({ children }: { children: ReactNode }) {
  const gate = useLoginGateState()

  return (
    <LoginGateContext.Provider value={gate.runWithLogin}>
      {children}
      {gate.isGateOpen && <LoginGateModal onLogin={gate.login} onClose={gate.close} />}
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
