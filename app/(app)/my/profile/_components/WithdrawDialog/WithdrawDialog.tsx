'use client'

import Image from 'next/image'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import { preloadImage } from '@/app/_global/_services/preloadImage.service'

// 아래 <Image>와 같은 값이어야 선로딩이 같은 요청을 만든다.
const ILLUSTRATION = { src: '/images/withdraw-characters.webp', width: 241, height: 186 }

type WithdrawDialogProps = {
  /** 탈퇴 요청 진행 중. 확정 버튼이 스피너로 바뀌고 닫기가 막힌다. */
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

// 슬픈 캐릭터가 모달 위 중앙에 걸친 회원 탈퇴 확인 모달.
export function WithdrawDialog({ loading, onCancel, onConfirm, open }: WithdrawDialogProps) {
  // 다이얼로그 내용은 열려야 마운트되지만 이 컴포넌트는 설정 화면과 함께 렌더된다 —
  // 여기서 선로딩하면 탈퇴 버튼을 누르기 전에 일러스트가 준비돼 팝인이 없다.
  // 전용 일러스트라 전역(IllustrationPreload)이 아닌 트리거 화면에서 받는다.
  preloadImage(ILLUSTRATION)

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
            src={ILLUSTRATION.src}
            alt=""
            width={ILLUSTRATION.width}
            height={ILLUSTRATION.height}
            loading="eager"
            className="h-auto w-full"
          />
        </Dialog.Illustration>
        <Dialog.Header>
          <Dialog.Title>회원 탈퇴하시겠어요?</Dialog.Title>
          <Dialog.Description>
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
