'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'

import { BLOCK_CONFIRM_TEXT } from '../../_data/moderation.constant'

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
      title={`${nickname}${BLOCK_CONFIRM_TEXT.titleSuffix}`}
      description={BLOCK_CONFIRM_TEXT.description}
      cancelLabel={BLOCK_CONFIRM_TEXT.cancelLabel}
      confirmLabel={BLOCK_CONFIRM_TEXT.confirmLabel}
      loading={loading}
      onCancel={onClose}
      onConfirm={onConfirm}
    />
  )
}
