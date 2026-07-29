import type { ReactNode } from 'react'

import { LoginGateProvider } from './_components/LoginGateProvider/LoginGateProvider'

/** 흔적 보기 트리 전체가 같은 로그인 게이트를 쓰므로 route 루트에서 한 번만 감싼다 */
export default function TraceLayout({ children }: { children: ReactNode }) {
  return <LoginGateProvider>{children}</LoginGateProvider>
}
