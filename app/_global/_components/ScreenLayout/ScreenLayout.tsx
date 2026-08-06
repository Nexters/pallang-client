'use client'

import { useRouter } from 'next/navigation'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import BackIcon from '../Icon/assets/back.svg'
import { TopBar } from '../TopBar/TopBar'

type ScreenLayoutProps = ComponentPropsWithoutRef<'main'> & {
  title: ReactNode
  /** 생략하면 router.back() — 흐름을 직접 되돌려야 하는 화면만 넘긴다 */
  onBack?: () => void
  /** 하단에 고정되는 CTA 자리. 홈 인디케이터 인셋은 여기서 pb-safe로 소비한다 */
  footer?: ReactNode
  /** 스크롤 body에 붙일 클래스 — 좌우·상하 패딩이 화면마다 다르다 */
  bodyClassName?: string
}

/**
 * 탭바 없는 서브 페이지 공통 셸 — Figma의 `navigation bar`를 쓰는 화면들이 이걸 공유한다.
 * TopBar는 데이터를 기다리지 않으므로 로딩 분기 바깥, 즉 이 레이아웃이 소유한다.
 * 흰 상단이 노치 뒤까지 이어지도록 셸의 safe-top 패딩을 되돌린 뒤 안에서 다시 더한다.
 */
export function ScreenLayout({
  title,
  onBack,
  footer,
  bodyClassName,
  className,
  children,
  ...props
}: ScreenLayoutProps) {
  const router = useRouter()

  return (
    <main
      className={cn(
        '-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)',
        className,
      )}
      {...props}
    >
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로 가기"
          onClick={() => {
            if (onBack) {
              onBack()
              return
            }
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">{title}</TopBar.Title>
        <TopBar.Spacer />
      </TopBar.Root>

      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', bodyClassName)}>
        {children}
      </div>

      {footer && <div className="flex shrink-0 px-4 pt-4 pb-safe">{footer}</div>}
    </main>
  )
}
