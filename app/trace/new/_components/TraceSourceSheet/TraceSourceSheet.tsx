'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type TraceSourceSheetProps = {
  open: boolean
  onClose: () => void
  onSelectPhoto: () => void
  onSelectManual: () => void
}

export function TraceSourceSheet({
  open,
  onClose,
  onSelectPhoto,
  onSelectManual,
}: TraceSourceSheetProps) {
  return (
    <BottomSheet open={open} title="새로운 흔적을 어떻게 남길까요?" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSelectPhoto}
          className="flex flex-col gap-2 rounded-lg bg-bg-surface p-4 text-left"
        >
          <span className="text-title-16sb text-text-primary">사진으로 입력</span>
          <span className="text-body-14rg text-text-tertiary">책 사진을 찍어 문장을 인식해요</span>
          <CameraIcon aria-hidden="true" className="size-6 self-end" />
        </button>
        <button
          type="button"
          onClick={onSelectManual}
          className="flex flex-col gap-2 rounded-lg bg-bg-surface p-4 text-left"
        >
          <span className="text-title-16sb text-text-primary">직접 입력</span>
          <span className="text-body-14rg text-text-tertiary">문장을 손으로 타이핑해요</span>
          <PencilIcon aria-hidden="true" className="size-6 self-end" />
        </button>
      </div>
    </BottomSheet>
  )
}
