'use client'

import { cn } from '@/app/_global/_services/cn.service'

import type { NotificationTabValue } from '../../_data/notificationTab.constant'

type NotificationTab = { value: NotificationTabValue; label: string }

type NotificationTabsProps = {
  tabs: readonly NotificationTab[]
  value: NotificationTabValue
  onChange: (value: NotificationTabValue) => void
}

export function NotificationTabs({ tabs, value, onChange }: NotificationTabsProps) {
  return (
    // 시안(3905:35744) — 목록이 밑으로 지나가도 탭이 남도록 스크롤 영역 위에 붙인다.
    // 고른 탭만 밑줄 2px만큼 길어지므로 items-start로 나머지 탭이 늘어나지 않게 한다.
    <div
      role="tablist"
      aria-label="알림 분류"
      className="sticky top-0 z-10 flex shrink-0 items-start gap-4 bg-bg-default px-4 drop-shadow-[0_6px_17.5px_rgba(0,0,0,0.08)]"
    >
      {tabs.map((tab) => {
        const isSelected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              onChange(tab.value)
            }}
            className={cn(
              'press flex items-center justify-center py-3.5 text-body-14rg',
              isSelected
                ? 'border-b-2 border-border-strong font-bold text-text-primary'
                : 'font-medium text-text-secondary',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
