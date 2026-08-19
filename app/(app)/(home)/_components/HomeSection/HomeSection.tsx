'use client'

import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { COACHMARK_TARGET } from '@/app/_global/_data/coachmarkTarget.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { HomeBookCarousel } from '../HomeBookCarousel/HomeBookCarousel'
import { HomeBookSectionHeader } from '../HomeBookSectionHeader/HomeBookSectionHeader'

type HomeSectionProps = {
  searchAction?: ReactNode
}

type HomeSectionTab = 'library' | 'opinion'

export function HomeSection({ searchAction }: HomeSectionProps) {
  const { isAuthenticated } = useAuth()
  const meQuery = useQuery({ ...userQueries.me(), enabled: isAuthenticated })
  const [activeTab, setActiveTab] = useState<HomeSectionTab>('library')

  return (
    <section aria-label="기록 중인 책 목록" className="mt-4.5 flex flex-col gap-[50px]">
      <HomeBookSectionHeader
        activeTab={activeTab}
        isAuthenticated={isAuthenticated}
        nickname={meQuery.data?.data?.nickname}
        searchAction={searchAction}
        onTabChange={setActiveTab}
      />

      {/* 코치마크가 책 카드를 못 찾을 때(아직 흔적을 남긴 책이 없을 때) 대신 비추는 자리다. */}
      {activeTab === 'library' && (
        <div data-coachmark={COACHMARK_TARGET.homeLibrary}>
          <HomeBookCarousel />
        </div>
      )}
    </section>
  )
}
