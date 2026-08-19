'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

import { useOnboardingGate } from '../../_hooks/useOnboardingGate'
import { HomeSection } from '../HomeSection/HomeSection'

const BOOK_SEARCH_PATH = '/book/search/my-books'

export function HomePageView() {
  useOnboardingGate()

  const router = useRouter()
  const runWithLogin = useLoginGate()

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
      className={`overflow-y-auto bg-bg-default ${GRID_BACKGROUND_CLASS_NAME}`}
    >
      <div className="px-4 pt-4">
        <header className="flex items-center">
          <Logo aria-label="Pallang" className="h-7 w-18.75" />
        </header>
      </div>

      <HomeSection
        searchAction={
          <button
            type="button"
            aria-label="검색"
            className="press flex size-[42px] shrink-0 items-center justify-center rounded-[100px] bg-[rgba(0,0,0,0.08)] text-icon-primary backdrop-blur-[4px] transition-[background-color,scale] duration-instant ease-standard"
            onClick={handleSearchClick}
          >
            <SearchIcon aria-hidden="true" className="size-6" />
          </button>
        }
      />
    </TabScreenLayout>
  )
}
