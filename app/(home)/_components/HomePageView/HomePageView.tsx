'use client'

import { useCallback, useState } from 'react'

import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { cn } from '@/app/_global/_services/cn.service'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

import { BookListSection } from '../BookListSection/BookListSection'

function HomeHeaderSkeleton() {
  return (
    <header className="flex h-8 items-center justify-between" aria-hidden="true">
      <div className="h-7 w-[100px] rounded bg-bg-surface" />
      <div className="size-8 rounded-full bg-bg-surface" />
    </header>
  )
}

export function HomePageView() {
  const [isBookListLoading, setIsBookListLoading] = useState(true)

  const handleBookListLoadingChange = useCallback((isLoading: boolean) => {
    setIsBookListLoading(isLoading)
  }, [])

  return (
    <TabScreenLayout
      aria-label="홈"
      activeTab="home"
      className={cn(
        'overflow-y-auto bg-bg-default',
        !isBookListLoading && GRID_BACKGROUND_CLASS_NAME,
      )}
      isTabBarLoading={isBookListLoading}
    >
      <div className="px-4 pt-4">
        {isBookListLoading ? (
          <HomeHeaderSkeleton />
        ) : (
          <header className="flex items-center justify-between">
            <Logo aria-label="Pallang" className="h-7 w-18.75" />
            <button
              type="button"
              aria-label="검색"
              className="flex size-8 items-center justify-center text-icon-primary"
            >
              <SearchIcon aria-hidden="true" className="size-8" />
            </button>
          </header>
        )}
      </div>

      <BookListSection onLoadingChange={handleBookListLoadingChange} />
    </TabScreenLayout>
  )
}
