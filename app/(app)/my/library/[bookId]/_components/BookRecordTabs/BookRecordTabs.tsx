'use client'

import { Tabs } from '@base-ui/react/tabs'

import { cn } from '@/app/_global/_services/cn.service'

import { BOOK_RECORD_TABS } from '../../_data/bookRecordTab.constant'

/**
 * 책 상세의 기록 종류 세그먼트.
 *
 * 목록만 세운다 — 고른 값과 패널은 BookDetailView의 `Tabs.Root`가 쥔다.
 * base-ui `Tabs` 위에 올린 이유는 탭 패턴의 키보드 규약(활성 탭 하나만 탭 순서에 두는 roving
 * tabindex, 좌우 키로 이동) 때문이다. role과 aria만 손으로 붙이면 스크린리더에는 탭으로 읽히지만
 * 키보드로는 버튼 세 개일 뿐이다.
 *
 * `SegmentedControl`은 어두운 면에 얹는 폼 입력(radiogroup)이라 톤·크기·의미가 모두 달라 따로 세운다.
 */
export function BookRecordTabs() {
  return (
    <Tabs.List aria-label="기록 종류" className="flex items-center rounded-full bg-black/8 p-1">
      {BOOK_RECORD_TABS.map((tab) => (
        <Tabs.Tab
          key={tab.value}
          value={tab.value}
          className={({ active }) =>
            cn(
              // press와 transition-colors를 함께 두면 transition-property가 서로를 덮는다.
              // 색과 눌림을 한 목록으로 합쳐 둘 다 살린다.
              'press w-16.5 rounded-full py-2 text-center transition-[color,background-color,scale] duration-instant ease-standard',
              active
                ? 'bg-bg-default text-title-14bd text-text-primary'
                : 'text-body-14md text-interactive-btn-secondary',
            )
          }
        >
          {tab.label}
        </Tabs.Tab>
      ))}
    </Tabs.List>
  )
}
