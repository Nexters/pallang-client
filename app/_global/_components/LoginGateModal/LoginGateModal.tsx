'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

type LoginGateModalProps = {
  /** 막힌 액션에 맞는 안내 문구. null이면 닫힌 상태다 — 문구 선택은 게이트를 호출한 쪽이 정한다 */
  message: string | null
  onLogin: () => void
  onClose: () => void
}

export function LoginGateModal({ message, onLogin, onClose }: LoginGateModalProps) {
  // 닫히는 동안 문구가 먼저 사라지면 퇴장 전환이 빈 카드로 보인다
  const shownMessage = useLastPresent(message)

  return (
    <Dialog.Root
      open={message !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      {/* 게이트는 일러스트가 없다 — Dialog.Content의 일러스트 자리 여백(pt-[46px])을 되돌린다 */}
      <Dialog.Content className="gap-4 pt-6">
        <Dialog.Header>
          <Dialog.Title className="text-title-16sb font-semibold leading-normal">
            {shownMessage}
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer className="flex-col">
          <Button
            variant="activated"
            className="rounded-full py-3 text-body-14sb"
            onClick={onLogin}
          >
            로그인 하러가기
          </Button>
          <Dialog.Close className="cursor-pointer text-body-14rg text-text-secondary opacity-50">
            닫기
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
