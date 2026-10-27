'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import {
  getAppStoreUrl,
  type MobileWebPlatform,
} from '@/app/_global/_services/mobileWebPlatform.service'

type AppInstallDialogProps = {
  open: boolean
  onClose: () => void
  platform: MobileWebPlatform | null
}

/** 코치마크를 마친 뒤 앱에서 이어 읽기를 권하는 안내다. */
export function AppInstallDialog({ open, onClose, platform }: AppInstallDialogProps) {
  const handleOpenAppClick = () => {
    if (!platform) return

    window.location.assign(getAppStoreUrl(platform))
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Viewport className="items-end pb-[max(8px,var(--safe-bottom))]">
          <Dialog.Popup illustrated={false}>
            <Dialog.Header>
              <Dialog.Title>팔랑 앱에서 함께 읽어보세요</Dialog.Title>
              <Dialog.Description>
                {'앱에서 다른 독자들의 생각을 읽고,\n나의 생각도 남겨보세요.'}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Button variant="back" className="h-[54px]" onClick={onClose}>
                웹에서 계속보기
              </Button>
              <Button variant="activated" className="h-[54px]" onClick={handleOpenAppClick}>
                앱으로 열기
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
