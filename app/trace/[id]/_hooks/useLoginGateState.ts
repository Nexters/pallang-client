import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'

import { DEFAULT_LOGIN_GATE_MESSAGE } from '../_data/loginGate.constant'

/**
 * 게이트 팝업의 열림 상태를 소유한다. 소비자는 LoginGateProvider의 useLoginGate를 쓴다.
 * 열림 여부를 따로 두지 않고 문구 하나로 표현해, 다음 게이트가 이전 문구를 물려받지 않는다.
 */
export function useLoginGateState() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [gateMessage, setGateMessage] = useState<string | null>(null)

  const runWithLogin = (action: () => void, message?: string) => {
    if (isAuthenticated) {
      action()
      return
    }
    setGateMessage(message ?? DEFAULT_LOGIN_GATE_MESSAGE)
  }

  const login = () => {
    router.push(LOGIN_PATH)
  }

  const close = () => {
    setGateMessage(null)
  }

  return { gateMessage, runWithLogin, login, close }
}
