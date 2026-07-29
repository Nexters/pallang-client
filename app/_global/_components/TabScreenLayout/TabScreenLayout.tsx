import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import { TabBar } from '../TabBar/TabBar'

type TabScreenLayoutProps = ComponentPropsWithoutRef<'section'> & {
  activeTab?: 'home' | 'my'
}

// 하단 TabBar가 있는 화면 공통 쉘 — 검정 배경 위에 rounded 컨텐츠 시트가 TabBar를 28px 덮는 구조
export function TabScreenLayout({
  activeTab,
  className,
  children,
  ...props
}: TabScreenLayoutProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-black">
      <section
        className={cn('relative z-10 min-h-0 flex-1 rounded-b-[28px]', className)}
        {...props}
      >
        {children}
      </section>
      <TabBar activeTab={activeTab} className="-mt-7 shrink-0" />
    </div>
  )
}
