import { useState } from 'react'

export function useLoginGate() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const runWithLogin = (action: () => void) => {
    if (isLoggedIn) {
      action()
      return
    }
    setPendingAction(() => action)
  }

  const login = () => {
    // ponytail: 목 로그인, 실제로는 로그인 페이지로 이동
    setIsLoggedIn(true)
    pendingAction?.()
    setPendingAction(null)
  }

  const close = () => {
    setPendingAction(null)
  }

  return { isGateOpen: pendingAction !== null, runWithLogin, login, close }
}
