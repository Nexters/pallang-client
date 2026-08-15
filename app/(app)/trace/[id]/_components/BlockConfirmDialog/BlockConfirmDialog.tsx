'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'

type BlockConfirmDialogProps = {
  open: boolean
  nickname: string
  /** 차단 요청이 처리 중인 동안 확인 버튼을 스피너로 잠근다 */
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function BlockConfirmDialog({
  open,
  nickname,
  loading,
  onClose,
  onConfirm,
}: BlockConfirmDialogProps) {
  return (
    <FlatDialog
      open={open}
      title={`${nickname}님을 차단할까요?`}
      description="차단하면 이 사용자의 흔적과 댓글이 더 이상 보이지 않아요."
      cancelLabel="취소"
      confirmLabel="차단"
      loading={loading}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  )
}
