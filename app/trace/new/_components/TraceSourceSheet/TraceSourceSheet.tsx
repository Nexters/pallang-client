'use client'

import type { FC, SVGProps } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type SourceOptionProps = {
  description: string
  icon: FC<SVGProps<SVGSVGElement>>
  onClick: () => void
  title: string
}

function SourceOption({ description, icon: Icon, onClick, title }: SourceOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[156px] min-w-px flex-1 cursor-pointer flex-col items-end justify-between overflow-hidden bg-bg-surface p-5 text-left"
    >
      <span className="flex w-full flex-col gap-1.5">
        <span className="text-title-18bd text-text-secondary">{title}</span>
        <span className="whitespace-pre-line text-body-14rg text-text-tertiary">{description}</span>
      </span>
      <Icon aria-hidden="true" className="size-[30px] shrink-0 text-icon-primary" />
    </button>
  )
}

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
      <div className="flex items-start gap-2">
        <SourceOption
          title="사진으로 입력"
          description={'책 사진을 찍어\n문장을 인식해요'}
          icon={CameraIcon}
          onClick={onSelectPhoto}
        />
        <SourceOption
          title="직접 입력"
          description={'문장을 손으로\n타이핑해요'}
          icon={PencilIcon}
          onClick={onSelectManual}
        />
      </div>
    </BottomSheet>
  )
}
