'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'

type SpoilerReleaseDialogProps = {
  open: boolean
  /** 해제 요청이 처리 중인 동안 확인 버튼을 스피너로 잠근다 */
  releasing?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 스포일러 해제 확인 다이얼로그.
 * 문구는 시안이 정한 자리에서 줄을 바꾼다 — Dialog가 pre-line이다.
 */
export function SpoilerReleaseDialog({
  open,
  releasing = false,
  onCancel,
  onConfirm,
}: SpoilerReleaseDialogProps) {
  return (
    <FlatDialog
      open={open}
      illustrated={false}
      title={'해당 문장의 스포일러를\n해제하시겠습니까?'}
      description={'스포일러 해제 시\n해당 문장이 다른 유저들에게 바로 보이게 됩니다.'}
      cancelLabel="뒤로"
      confirmLabel="스포일러 해제"
      loading={releasing}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
