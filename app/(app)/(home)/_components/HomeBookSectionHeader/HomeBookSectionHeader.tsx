'use client'

import type { ReactNode } from 'react'

import { HomeSegment } from '../HomeSegment/HomeSegment'

type HomeSectionTab = 'library' | 'opinion'

type HomeBookSectionHeaderProps = {
  activeTab: HomeSectionTab
  isAuthenticated: boolean
  nickname?: string
  onTabChange: (tab: HomeSectionTab) => void
  searchAction?: ReactNode
}

const HOME_SECTION_TABS = [
  { value: 'library', label: '내 서재' },
  { value: 'opinion', label: '내 의견' },
] as const satisfies readonly { value: HomeSectionTab; label: string }[]

const SECTION_TITLE_CLASS_NAME =
  'font-pretendard text-[22px] leading-[1.3] font-bold tracking-[-0.88px] text-text-secondary'

function SectionTitle({
  isAuthenticated,
  nickname,
}: {
  isAuthenticated: boolean
  nickname?: string
}) {
  const lines = isAuthenticated
    ? [`${nickname ?? '팔랑'} 님!`, '오늘도 기록을 남겨볼까요?']
    : ['안녕하세요!', '오늘도 기록을 남겨볼까요?']

  return (
    <h1 className={SECTION_TITLE_CLASS_NAME}>
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
    </h1>
  )
}

export function HomeBookSectionHeader({
  activeTab,
  isAuthenticated,
  nickname,
  onTabChange,
  searchAction,
}: HomeBookSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-4">
      <SectionTitle isAuthenticated={isAuthenticated} nickname={nickname} />
      <div className="flex items-center justify-between">
        <div
          role="radiogroup"
          aria-label="홈 목록 보기"
          className="flex w-fit items-center rounded-[99px] bg-[rgba(0,0,0,0.08)] p-[3px] backdrop-blur-[2px]"
        >
          {HOME_SECTION_TABS.map((tab) => (
            <HomeSegment
              key={tab.value}
              selected={activeTab === tab.value}
              onClick={() => {
                onTabChange(tab.value)
              }}
            >
              {tab.label}
            </HomeSegment>
          ))}
        </div>
        {searchAction}
      </div>
    </div>
  )
}
