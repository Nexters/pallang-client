'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import type { CameraPermissionKind } from '@/app/_global/_data/camera.model'
import { openAppSettings } from '@/app/_global/_services/appSettings.service'

type OcrPermissionNoticeProps = {
  kind: CameraPermissionKind
  /** 카메라만 막혔을 때의 대안. 사진 권한까지 막혔으면 호출되지 않는다. */
  onPickFromGallery: () => void
}

const NOTICE = {
  camera: '카메라 권한이 꺼져 있어요.\n설정에서 켜면 바로 촬영할 수 있어요.',
  photos: '사진 권한이 꺼져 있어요.\n설정에서 켜면 앨범에서 고를 수 있어요.',
} satisfies Record<CameraPermissionKind, string>

/**
 * 권한이 이미 거부된 상태의 안내. 촬영 실패 안내와 같은 자리를 쓴다 —
 * 카메라가 열리지 않아 화면이 비어 있는데 그 위에 모달을 또 얹으면 막이 두 겹이 된다.
 */
export function OcrPermissionNotice({ kind, onPickFromGallery }: OcrPermissionNoticeProps) {
  return (
    <div
      role="alert"
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <p className="whitespace-pre-line text-body-16md text-text-inverse opacity-80">
        {NOTICE[kind]}
      </p>
      <div className="flex w-full max-w-[311px] flex-col gap-2">
        <Button
          variant="activated"
          className="h-[54px] px-6"
          onClick={() => {
            void openAppSettings()
          }}
        >
          설정 열기
        </Button>
        {/* 사진 권한까지 막혔으면 눌러도 같은 벽에 부딪힌다. 아예 내보내지 않는다. */}
        {kind === 'camera' && (
          <Button className="h-[54px] px-6" onClick={onPickFromGallery}>
            갤러리에서 선택하기
          </Button>
        )}
      </div>
    </div>
  )
}
