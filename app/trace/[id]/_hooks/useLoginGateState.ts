import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'

/** 게이트 팝업의 열림 상태를 소유한다. 소비자는 LoginGateProvider의 useLoginGate를 쓴다 */
export function useLoginGateState() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isGateOpen, setIsGateOpen] = useState(false)

  const runWithLogin = (action: () => void) => {
    if (isAuthenticated) {
      action()
      return
    }
    setIsGateOpen(true)
  }

  const login = () => {
    router.push(LOGIN_PATH)
  }

  const close = () => {
    setIsGateOpen(false)
  }

  return { isGateOpen, runWithLogin, login, close }
}
