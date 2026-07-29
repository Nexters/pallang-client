import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { LOGIN_PATH } from '@/app/_global/_data/auth.constant'
import { DEFAULT_LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'

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
    // 게이트는 루트 레이아웃에 있어 화면이 바뀌어도 살아 있다. 여기서 닫지 않으면
    // 로그인 화면 위에 모달이 그대로 덮인다.
    setGateMessage(null)
    router.push(LOGIN_PATH)
  }

  const close = () => {
    setGateMessage(null)
  }

  return { gateMessage, runWithLogin, login, close }
}
