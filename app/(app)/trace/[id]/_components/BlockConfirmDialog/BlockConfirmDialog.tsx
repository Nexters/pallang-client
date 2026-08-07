'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

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
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      {/* 로그인 게이트처럼 일러스트가 없다 — Dialog.Content의 일러스트 자리 여백(pt-[46px])을 되돌린다 */}
      <Dialog.Content className="gap-4 pt-6">
        <Dialog.Header>
          <Dialog.Title className="text-title-16sb leading-normal font-semibold">
            {nickname}님을 차단할까요?
          </Dialog.Title>
          <Dialog.Description className="text-text-tertiary">
            차단하면 이 사용자의 흔적과 댓글이 더 이상 보이지 않아요.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" className="rounded-full py-3 text-body-14sb" onClick={onClose}>
            취소
          </Button>
          <Button
            variant="activated"
            className="rounded-full py-3 text-body-14sb"
            loading={loading}
            onClick={onConfirm}
          >
            차단
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
