'use client'

import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type WithdrawDialogProps = {
  /** 탈퇴 요청 진행 중. 확정 버튼이 스피너로 바뀌고 닫기가 막힌다. */
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

// Figma 2432:13714 — 슬픈 캐릭터가 모달 위 중앙에 걸친 회원 탈퇴 확인 모달.
export function WithdrawDialog({ loading, onCancel, onConfirm, open }: WithdrawDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // 요청이 나간 뒤에는 백드롭·Esc로 닫지 못한다 — 결과를 보고 화면이 전환된다
        if (!nextOpen && !loading) onCancel()
      }}
    >
      <Dialog.Content>
        <Dialog.Illustration>
          <Image
            src="/images/withdraw-characters.png"
            alt=""
            width={241}
            height={186}
            loading="eager"
            className="h-auto w-full"
          />
        </Dialog.Illustration>
        <Dialog.Header>
          <Dialog.Title>회원 탈퇴하시겠어요?</Dialog.Title>
          <Dialog.Description className="whitespace-pre-line">
            {'회원 탈퇴 시 지금까지 기록한 내용들이 사라지며,\n복구가 불가능합니다.'}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" className="h-[54px]" disabled={loading} onClick={onCancel}>
            뒤로
          </Button>
          <Button variant="activated" className="h-[54px]" loading={loading} onClick={onConfirm}>
            회원 탈퇴하기
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
