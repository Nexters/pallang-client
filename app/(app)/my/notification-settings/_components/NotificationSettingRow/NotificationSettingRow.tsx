'use client'

import { useId } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import type { NotificationSettingItem } from '../../_data/notificationSetting.constant'
import { NotificationSwitch } from '../NotificationSwitch/NotificationSwitch'

type NotificationSettingRowProps = {
  item: NotificationSettingItem
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** 같은 이름의 항목이 묶음마다 있어 묶음 제목까지 붙여 스위치 이름을 가른다 */
  sectionTitleId?: string
  /** 묶음 밖 최상단 항목(푸시 알림)은 제목·설명 간격이 조금 넓다 */
  className?: string
}

export function NotificationSettingRow({
  item,
  checked,
  onCheckedChange,
  sectionTitleId,
  className,
}: NotificationSettingRowProps) {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <div className="flex items-center gap-6">
      <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}>
        <p id={labelId} className="text-body-16bd text-text-primary">
          {item.label}
        </p>
        <p id={descriptionId} className="text-caption-12rg text-text-tertiary">
          {item.description}
        </p>
      </div>
      <NotificationSwitch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={sectionTitleId ? `${sectionTitleId} ${labelId}` : labelId}
        aria-describedby={descriptionId}
      />
    </div>
  )
}
