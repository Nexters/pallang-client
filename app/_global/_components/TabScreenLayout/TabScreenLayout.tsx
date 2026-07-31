'use client'

import { useRouter } from 'next/navigation'
import { type ComponentPropsWithoutRef, useEffect, useTransition } from 'react'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import { TabBar } from '../TabBar/TabBar'

type TabScreenLayoutProps = ComponentPropsWithoutRef<'section'> & {
  activeTab?: 'home' | 'my'
  isTabBarLoading?: boolean
}

const TRACE_CREATE_PATH = '/trace/new'

// 하단 TabBar가 있는 화면 공통 쉘 — 검정 배경 위에 rounded 컨텐츠 시트가 TabBar를 28px 덮는 구조
export function TabScreenLayout({
  activeTab,
  className,
  children,
  isTabBarLoading = false,
  ...props
}: TabScreenLayoutProps) {
  const router = useRouter()
  const runWithLogin = useLoginGate()
  const [isTracePending, startTransition] = useTransition()

  // 이 버튼은 로그인 게이트 때문에 Link가 아니라 button이다 — Link가 대신 해주던 프리페치가
  // 없어 첫 탭에서 라우트를 받아오는 동안 화면이 잠깐 멈춰 있었다. 들어설 때 미리 받아둔다.
  useEffect(() => {
    router.prefetch(TRACE_CREATE_PATH)
  }, [router])

  return (
    // 셸의 safe-area 패딩을 되돌려 컨텐츠 시트 배경이 노치 뒤까지 이어지게 한다.
    // 인셋은 시트 안쪽(pt-(--safe-top))에서 다시 더해져 내용은 노치 아래에서 시작한다.
    <div className="relative -mt-(--safe-top) flex min-h-0 flex-1 flex-col bg-bg-black">
      <section
        className={cn('relative z-10 min-h-0 flex-1 rounded-b-[28px] pt-(--safe-top)', className)}
        {...props}
      >
        {children}
      </section>
      <TabBar
        activeTab={activeTab}
        className="-mt-7 shrink-0"
        isLoading={isTabBarLoading}
        isTracePending={isTracePending}
        // 흔적 저장은 로그인이 필요하다. 그냥 들여보내면 다 작성한 뒤 저장에서 401로 막힌다.
        onTraceClick={() => {
          runWithLogin(() => {
            // 프리페치가 늦거나 실패했을 때를 위해 이동 자체를 전환으로 감싼다 —
            // 그동안 버튼이 '처리 중'으로 보여 눌렀는데 아무 반응 없는 구간이 없어진다.
            startTransition(() => {
              router.push(TRACE_CREATE_PATH)
            })
          }, LOGIN_GATE_MESSAGE.traceCreate)
        }}
      />
    </div>
  )
}
