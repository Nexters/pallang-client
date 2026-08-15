'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'
import { LOGIN_GATE_TITLE } from '@/app/_global/_data/loginGate.constant'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

type LoginGateModalProps = {
  /** 막힌 액션에 맞는 안내 문구. null이면 닫힌 상태다 — 문구 선택은 게이트를 호출한 쪽이 정한다 */
  message: string | null
  onLogin: () => void
  onClose: () => void
}

export function LoginGateModal({ message, onLogin, onClose }: LoginGateModalProps) {
  // 닫히는 동안 문구가 먼저 사라지면 퇴장 전환 중에 설명 줄만 빈다
  const shownMessage = useLastPresent(message)

  return (
    <FlatDialog
      open={message !== null}
      title={LOGIN_GATE_TITLE}
      description={shownMessage}
      cancelLabel="취소"
      confirmLabel="로그인 하러가기"
      onCancel={onClose}
      onConfirm={onLogin}
    />
  )
}
