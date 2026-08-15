'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'

type TraceExitDialogProps = {
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

export function TraceExitDialog({ onCancel, onConfirm, open }: TraceExitDialogProps) {
  return (
    <FlatDialog
      open={open}
      title={'지금 나가면\n작성 중이던 흔적이 사라져요'}
      description="남긴 문장과 의견은 저장되지 않아요."
      cancelLabel="이어서 쓸게요"
      confirmLabel="나갈게요"
      // 나가기와 이어쓰기 중 하나를 골라야 한다 — 백드롭·Esc로는 빠져나갈 수 없다
      dismissible={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
