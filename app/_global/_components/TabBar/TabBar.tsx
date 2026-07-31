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
  /** 흔적 남기기 이동이 진행 중. Button과 같은 규칙으로 색은 유지한 채 pulse로 알리고 중복 탭을 막는다. */
  isTracePending?: boolean
  /** 흔적 남기기는 로그인이 필요해 이동 전에 게이트를 거친다. 넘기지 않으면 traceHref로 바로 이동한다. */
  onTraceClick?: () => void
  traceHref?: string
  myHref?: string
}

const TRACE_BUTTON_CLASS =
  'press flex shrink-0 items-center justify-center gap-2 rounded-full bg-interactive-accent px-4 py-3 text-body-16md text-text-primary'

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
        'press flex w-12 shrink-0 flex-col items-center gap-0.5 text-caption-12rg uppercase text-text-inverse',
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
  isTracePending = false,
  onTraceClick,
  traceHref = '/trace/new',
  myHref = '/my',
  ...props
}: TabBarProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        // 하단 인셋만큼 바닥을 늘려 제스처 바/내비게이션 바가 메뉴를 덮지 않게 한다.
        // 높이를 min-h로 두는 이유: 인셋이 없는 기기(브라우저·구형 안드로이드)에서는 기존 높이 그대로 유지된다.
        'relative flex min-h-30.5 w-full items-start justify-center overflow-hidden bg-nav-bg px-4 pt-12.5 pb-(--safe-bottom) text-text-inverse',
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
                // 이동이 끝나기 전에 또 누르면 같은 화면으로 두 번 밀어 넣는다
                disabled={isTracePending}
                aria-busy={isTracePending || undefined}
                className={cn(
                  TRACE_BUTTON_CLASS,
                  'cursor-pointer',
                  isTracePending && 'animate-pulse',
                )}
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
