'use client'

import { App } from '@capacitor/app'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'
import { cn } from '@/app/_global/_services/cn.service'
import { markOnboardingSeen } from '@/app/_shared/onboarding/_services/onboardingSeen.service'

import { ONBOARDING_STEPS } from '../../_data/onboarding.constant'

export function OnboardingView() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)

  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1

  const finishOnboarding = () => {
    markOnboardingSeen()
    router.replace('/')
  }

  const handleNextClick = () => {
    if (isLastStep) {
      finishOnboarding()
      return
    }
    setStepIndex((index) => index + 1)
  }

  // 첫 단계에서는 홈을 replace로 떠나온 뒤라 되돌아갈 화면이 없다 — 안드로이드 관례대로 앱을 닫는다
  useHardwareBack(() => {
    if (stepIndex > 0) setStepIndex((index) => index - 1)
    else void App.exitApp()
  })

  return (
    <section
      aria-label="온보딩"
      className="-mt-(--safe-top) flex min-h-0 flex-1 flex-col overflow-hidden bg-bg-default pt-(--safe-top)"
    >
      <div className="h-11 shrink-0" />

      {/* 단계별 텍스트를 겹쳐 두고 크로스페이드한다 */}
      <div className="relative h-75 shrink-0">
        {ONBOARDING_STEPS.map((item, index) => (
          <div
            key={item.imageSrc}
            aria-hidden={index !== stepIndex || undefined}
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center',
              'transition-opacity duration-normal ease-standard',
              index === stepIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <h1 className="whitespace-nowrap text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-text-secondary">
              {item.titleLines.map((line, lineIndex) => (
                <Fragment key={line}>
                  {lineIndex > 0 && <br aria-hidden />}
                  {line}
                </Fragment>
              ))}
            </h1>
            <p className="whitespace-nowrap text-title-18md text-text-tertiary">
              {item.descriptionLines.map((line, lineIndex) => (
                <Fragment key={line}>
                  {lineIndex > 0 && <br aria-hidden />}
                  {line}
                </Fragment>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* 4장을 모두 렌더해 겹쳐 두고 현재 단계만 보인다 — 미리 로드되어 전환이 비지 않고, 크로스페이드로 이어진다 */}
      <div className="relative min-h-0 flex-1">
        {ONBOARDING_STEPS.map((item, index) => (
          <Image
            key={item.imageSrc}
            src={item.imageSrc}
            alt=""
            width={item.imageWidth}
            height={item.imageHeight}
            priority={index === 0}
            className={cn(
              'absolute inset-0 m-auto object-contain',
              'transition-opacity duration-slow ease-standard',
              index === stepIndex ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-4 p-4">
        {/* 마지막 단계에서도 자리를 유지한 채 페이드아웃한다 — 이미지·버튼 위치가 튀지 않는다.
            press가 opacity를 duration-instant로 전환하므로 페이드는 래퍼가 맡는다. */}
        <div
          aria-hidden={isLastStep || undefined}
          className={cn(
            'transition-opacity duration-normal ease-standard',
            isLastStep && 'pointer-events-none opacity-0',
          )}
        >
          <button
            type="button"
            onClick={finishOnboarding}
            tabIndex={isLastStep ? -1 : undefined}
            className="press text-body-16md text-text-primary/80"
          >
            건너뛰기
          </button>
        </div>
        <Button
          variant={isLastStep ? 'activated' : 'default'}
          onClick={handleNextClick}
          className="h-13.5 w-full"
        >
          {isLastStep ? '시작하기' : '다음'}
        </Button>
      </div>
    </section>
  )
}
