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
  traceHref?: string
  myHref?: string
}

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

export function TabBar({
  activeTab = 'home',
  className,
  homeHref = '/',
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
      <div className="flex items-center gap-8">
        <TabLink href={homeHref} icon={HomeIcon} isActive={activeTab === 'home'} label="home" />
        <Link
          href={traceHref}
          className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-interactive-accent px-4 py-3 text-body-16md text-text-primary"
        >
          <PlusIcon aria-hidden="true" className="size-6" />
          <span>흔적 남기기</span>
        </Link>
        <TabLink href={myHref} icon={MyIcon} isActive={activeTab === 'my'} label="MY" />
      </div>
    </nav>
  )
}
