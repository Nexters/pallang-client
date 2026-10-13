'use client'

import type { ReactNode } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { cn } from '@/app/_global/_services/cn.service'
import { GRID_BACKGROUND_CLASS_NAME } from '@/app/_global/_styles/background.constant'
import Logo from '@/public/images/logo.svg'

export function SplashProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  // 인증 판정이 끝나면 즉시 해제한다 — 인위적 최소 노출(구 MIN_SPLASH_MS)은 두지 않는다(#321).
  // 판정이 영영 안 끝나는 실패(JS 미실행 포함)의 상한은 네이티브가 맡는다
  // (capacitor.config.ts SplashScreen.launchShowDuration).
  const shouldShowSplash = status === 'loading'
  // 스플래시는 첫 프레임부터 떠 있어야 하므로 entering에는 스타일을 주지 않는다 — 퇴장만 전환한다
  const splash = useExitTransition(shouldShowSplash, MOTION_DURATION.normal)

  return (
    <>
      {children}
      {splash.shouldRender && (
        <div
          aria-hidden="true"
          data-state={splash.state}
          className={cn(
            'absolute inset-0 z-50 flex items-center justify-center overflow-hidden',
            'transition-opacity duration-normal ease-exit',
            'data-[state=exiting]:opacity-0',
            // 페이드아웃 동안 z-50으로 덮고 있어 첫 탭을 삼킨다
            'data-[state=exiting]:pointer-events-none',
            GRID_BACKGROUND_CLASS_NAME,
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80.7%] bg-linear-to-b from-transparent to-neutral-200" />
          <div className="relative flex -translate-y-px flex-col items-center gap-1">
            <Logo className="h-25 w-60" />
            <p className="whitespace-nowrap font-pretendard text-title-16sb text-text-primary">
              흔적을 넘기면, 다른 생각이 팔랑
            </p>
          </div>
        </div>
      )}
    </>
  )
}
