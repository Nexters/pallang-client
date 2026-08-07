'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type TraceExitDialogProps = {
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

export function TraceExitDialog({ onCancel, onConfirm, open }: TraceExitDialogProps) {
  return (
    // 나가기와 이어쓰기 중 하나를 골라야 한다. open만 제어해 백드롭·Esc로는 닫히지 않게 둔다.
    <Dialog.Root open={open}>
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>{'지금 나가면\n작성 중이던 흔적이 사라져요'}</Dialog.Title>
          <Dialog.Description>남긴 문장과 의견은 저장되지 않아요.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" onClick={onCancel}>
            이어서 쓸게요
          </Button>
          <Button variant="activated" onClick={onConfirm}>
            나갈게요
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
