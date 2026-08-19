'use client'

import { cn } from '@/app/_global/_services/cn.service'

import {
  BOOK_RECORD_TABS,
  type BookRecordTab,
  bookRecordTabIds,
} from '../../_data/bookRecordTab.constant'

type BookRecordTabsProps = {
  value: BookRecordTab
  onChange: (value: BookRecordTab) => void
}

/**
 * 책 상세의 기록 종류 세그먼트(Figma 225:12612).
 * `SegmentedControl`은 어두운 면에 얹는 폼 입력(radiogroup)이라 톤·크기·의미가 모두 달라 따로 세운다.
 */
export function BookRecordTabs({ value, onChange }: BookRecordTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="기록 종류"
      className="flex items-center rounded-full bg-black/8 p-1"
    >
      {BOOK_RECORD_TABS.map((tab) => {
        const selected = tab.value === value
        const { tabId, panelId } = bookRecordTabIds(tab.value)

        return (
          <button
            key={tab.value}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => {
              onChange(tab.value)
            }}
            className={cn(
              // press와 transition-colors를 함께 두면 transition-property가 서로를 덮는다.
              // 색과 눌림을 한 목록으로 합쳐 둘 다 살린다.
              'press w-16.5 rounded-full py-2 text-center transition-[color,background-color,scale] duration-instant ease-standard',
              selected
                ? 'bg-bg-default text-title-14bd text-text-primary'
                : 'text-body-14md text-interactive-btn-secondary',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
