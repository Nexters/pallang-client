'use client'

import { useRouter } from 'next/navigation'
import type { ComponentPropsWithoutRef } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import { TabBar } from '../TabBar/TabBar'

type TabScreenLayoutProps = ComponentPropsWithoutRef<'section'> & {
  activeTab?: 'home' | 'my'
}

const TRACE_CREATE_PATH = '/trace/new'

// 하단 TabBar가 있는 화면 공통 쉘 — 검정 배경 위에 rounded 컨텐츠 시트가 TabBar를 28px 덮는 구조
export function TabScreenLayout({
  activeTab,
  className,
  children,
  ...props
}: TabScreenLayoutProps) {
  const router = useRouter()
  const runWithLogin = useLoginGate()

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg-black">
      <section
        className={cn('relative z-10 min-h-0 flex-1 rounded-b-[28px]', className)}
        {...props}
      >
        {children}
      </section>
      <TabBar
        activeTab={activeTab}
        className="-mt-7 shrink-0"
        // 흔적 저장은 로그인이 필요하다. 그냥 들여보내면 다 작성한 뒤 저장에서 401로 막힌다.
        onTraceClick={() => {
          runWithLogin(() => {
            router.push(TRACE_CREATE_PATH)
          }, LOGIN_GATE_MESSAGE.traceCreate)
        }}
      />
    </div>
  )
}
