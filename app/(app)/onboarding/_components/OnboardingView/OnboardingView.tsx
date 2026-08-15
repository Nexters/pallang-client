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

  const step = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0]
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

      <div className="flex h-75 shrink-0 flex-col items-center justify-center gap-2.5 px-6 py-25 text-center">
        <h1 className="whitespace-nowrap text-[24px] font-bold leading-[1.2] tracking-[-0.02em] text-text-secondary">
          {step.titleLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && <br aria-hidden />}
              {line}
            </Fragment>
          ))}
        </h1>
        <p className="whitespace-nowrap text-title-18md text-text-tertiary">
          {step.descriptionLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && <br aria-hidden />}
              {line}
            </Fragment>
          ))}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {/* 4장을 모두 렌더해 두고 현재 단계만 보인다 — 단계를 넘길 때 이미지 로딩으로 비지 않는다 */}
        {ONBOARDING_STEPS.map((item, index) => (
          <Image
            key={item.imageSrc}
            src={item.imageSrc}
            alt=""
            width={item.imageWidth}
            height={item.imageHeight}
            priority={index === 0}
            className={cn('object-contain', index !== stepIndex && 'hidden')}
          />
        ))}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-4 p-4">
        {isLastStep ? (
          <Button variant="activated" onClick={finishOnboarding} className="h-13.5 w-full">
            시작하기
          </Button>
        ) : (
          <>
            <button
              type="button"
              onClick={finishOnboarding}
              className="press text-body-16md text-text-primary/80"
            >
              건너뛰기
            </button>
            <Button onClick={handleNextClick} className="h-13.5 w-full">
              다음
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
