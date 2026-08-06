'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import { openAppSettings } from '@/app/_global/_services/appSettings.service'

type PhotoPermissionDialogProps = {
  open: boolean
  onClose: () => void
}

/**
 * 사진 권한이 이미 거부된 상태의 안내. 한 번 거부하면 앱에서 권한 창을 다시 띄울 수 없어
 * (camera.model의 CameraPermissionDeniedError 참고) 재시도 대신 설정 화면으로 보낸다.
 */
export function PhotoPermissionDialog({ open, onClose }: PhotoPermissionDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>사진 권한이 꺼져 있어요</Dialog.Title>
          <Dialog.Description className="whitespace-pre-line">
            {'설정에서 사진 접근을 허용하면\n프로필 이미지를 바꿀 수 있어요.'}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" className="h-[54px]" onClick={onClose}>
            닫기
          </Button>
          <Button
            variant="activated"
            className="h-[54px]"
            onClick={() => {
              void openAppSettings()
              // 설정으로 나간 사이 모달을 열어둘 이유가 없다 — 돌아오면 편집 버튼이 그대로 있다.
              onClose()
            }}
          >
            설정 열기
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
