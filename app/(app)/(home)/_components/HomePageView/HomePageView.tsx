'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

import { useOnboardingGate } from '../../_hooks/useOnboardingGate'
import { BookListSection } from '../BookListSection/BookListSection'

const BOOK_SEARCH_PATH = '/book/search'

function HomeHeaderSkeleton() {
  return (
    <header className="flex h-7 items-center" aria-hidden="true">
      <div className="h-7 w-[100px] rounded bg-bg-surface" />
    </header>
  )
}

export function HomePageView() {
  useOnboardingGate()

  const router = useRouter()
  const runWithLogin = useLoginGate()
  const [isBookListLoading, setIsBookListLoading] = useState(true)

  const handleBookListLoadingChange = useCallback((isLoading: boolean) => {
    setIsBookListLoading(isLoading)
  }, [])

  useEffect(() => {
    router.prefetch(BOOK_SEARCH_PATH)
  }, [router])

  const handleSearchClick = () => {
    runWithLogin(() => {
      router.push(BOOK_SEARCH_PATH)
    })
  }

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
          <header className="flex items-center">
            <Logo aria-label="Pallang" className="h-7 w-18.75" />
          </header>
        )}
      </div>

      <BookListSection
        onLoadingChange={handleBookListLoadingChange}
        searchAction={
          <button
            type="button"
            aria-label="검색"
            className="press flex size-[42px] shrink-0 items-center justify-center rounded-[100px] bg-bg-default text-icon-primary backdrop-blur-[4px] transition-[background-color,scale] duration-instant ease-standard"
            onClick={handleSearchClick}
          >
            <SearchIcon aria-hidden="true" className="size-6" />
          </button>
        }
      />
    </TabScreenLayout>
  )
}
