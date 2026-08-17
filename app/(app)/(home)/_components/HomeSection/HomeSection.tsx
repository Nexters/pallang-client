'use client'

import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { HomeBookCarousel } from '../HomeBookCarousel/HomeBookCarousel'
import { HomeBookSectionHeader } from '../HomeBookSectionHeader/HomeBookSectionHeader'

type HomeSectionProps = {
  onLoadingChange?: (isLoading: boolean) => void
  searchAction?: ReactNode
}

type HomeSectionTab = 'library' | 'opinion'

export function HomeSection({ onLoadingChange, searchAction }: HomeSectionProps) {
  const { isAuthenticated } = useAuth()
  const meQuery = useQuery({ ...userQueries.me(), enabled: isAuthenticated })
  const [activeTab, setActiveTab] = useState<HomeSectionTab>('library')

  useEffect(() => {
    if (activeTab === 'library') return

    onLoadingChange?.(false)
  }, [activeTab, onLoadingChange])

  return (
    <section aria-label="기록 중인 책 목록" className="mt-4.5 flex flex-col gap-[50px]">
      <HomeBookSectionHeader
        activeTab={activeTab}
        isAuthenticated={isAuthenticated}
        nickname={meQuery.data?.data?.nickname}
        searchAction={searchAction}
        onTabChange={setActiveTab}
      />

      {activeTab === 'library' && <HomeBookCarousel onLoadingChange={onLoadingChange} />}
    </section>
  )
}
