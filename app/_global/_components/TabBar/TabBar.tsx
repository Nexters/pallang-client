import Link from 'next/link'
import type { ComponentPropsWithoutRef, FC, SVGProps } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import HomeIcon from '../Icon/assets/home.svg'
import MyIcon from '../Icon/assets/my.svg'
import PlusIcon from '../Icon/assets/plus.svg'

type TabBarTab = 'home' | 'my'

type TabBarProps = ComponentPropsWithoutRef<'nav'> & {
  activeTab?: TabBarTab
  homeHref?: string
  isLoading?: boolean
  /** 흔적 남기기는 로그인이 필요해 이동 전에 게이트를 거친다. 넘기지 않으면 traceHref로 바로 이동한다. */
  onTraceClick?: () => void
  traceHref?: string
  myHref?: string
}

const TRACE_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center gap-2 rounded-full bg-interactive-accent px-4 py-3 text-body-16md text-text-primary'

type TabLinkProps = {
  href: string
  icon: FC<SVGProps<SVGSVGElement>>
  isActive: boolean
  label: string
}

function TabLink({ href, icon: Icon, isActive, label }: TabLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex w-12 shrink-0 flex-col items-center gap-0.5 text-caption-12rg uppercase text-text-inverse',
        !isActive && 'opacity-60',
      )}
    >
      <Icon aria-hidden="true" className="size-7" />
      <span>{label}</span>
    </Link>
  )
}

function TabBarSkeleton() {
  return (
    <>
      <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
        <div className="size-6.5 rounded-full bg-white/50" />
        <div className="h-2 w-8 rounded-[1px] bg-white/50" />
      </div>
      <div className="h-10 w-[118px] rounded-full bg-white/50" />
      <div className="flex w-12 shrink-0 flex-col items-center gap-0.5">
        <div className="size-6.5 rounded-full bg-white/10" />
        <div className="h-2 w-8 rounded-[1px] bg-white/10" />
      </div>
    </>
  )
}

export function TabBar({
  activeTab = 'home',
  className,
  homeHref = '/',
  isLoading = false,
  onTraceClick,
  traceHref = '/trace/new',
  myHref = '/my',
  ...props
}: TabBarProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        'relative flex h-30.5 w-full items-start justify-center overflow-hidden bg-nav-bg px-4 pt-12.5 text-text-inverse',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-8" aria-hidden={isLoading ? 'true' : undefined}>
        {isLoading ? (
          <TabBarSkeleton />
        ) : (
          <>
            <TabLink href={homeHref} icon={HomeIcon} isActive={activeTab === 'home'} label="home" />
            {/* 흔적 저장은 로그인이 필요하다. 게이트를 받으면 링크 대신 버튼으로 그려 이동 전에 확인한다. */}
            {onTraceClick ? (
              <button
                type="button"
                onClick={onTraceClick}
                className={cn(TRACE_BUTTON_CLASS, 'cursor-pointer')}
              >
                <PlusIcon aria-hidden="true" className="size-6 text-icon-primary" />
                <span>흔적 남기기</span>
              </button>
            ) : (
              <Link href={traceHref} className={TRACE_BUTTON_CLASS}>
                <PlusIcon aria-hidden="true" className="size-6 text-icon-primary" />
                <span>흔적 남기기</span>
              </Link>
            )}
            <TabLink href={myHref} icon={MyIcon} isActive={activeTab === 'my'} label="MY" />
          </>
        )}
      </div>
    </nav>
  )
}
