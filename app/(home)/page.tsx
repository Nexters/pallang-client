import Link from 'next/link'

import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { cn } from '@/app/_global/_services/cn.service'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

import { BookListSection } from './_components/BookListSection/BookListSection'

export default function Home() {
  return (
    <TabScreenLayout
      aria-label="홈"
      activeTab="home"
      className={cn('overflow-y-auto', GRID_BACKGROUND_CLASS_NAME)}
    >
      <div className="px-4 pt-4">
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

        <div className="mt-9 flex flex-col gap-1">
          <h1 className="text-title-20sb text-text-primary">지금 기록되고 있는 흔적들</h1>
          <Link
            href="/book/internal"
            className="flex items-center gap-0.5 self-start text-title-16sb text-text-primary opacity-60"
          >
            <span>12권 모두 보기</span>
            <NextIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      <BookListSection />
    </TabScreenLayout>
  )
}
