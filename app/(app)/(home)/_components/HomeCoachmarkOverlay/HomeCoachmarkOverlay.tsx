'use client'

import { useRef, useState } from 'react'

import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'
import { cn } from '@/app/_global/_services/cn.service'

import { HOME_COACHMARK_STEPS } from '../../_data/coachmark.constant'
import { useCoachmarkLayout } from '../../_hooks/useCoachmarkLayout'
import { CoachmarkTooltip } from '../CoachmarkTooltip/CoachmarkTooltip'

type HomeCoachmarkOverlayProps = {
  state: ExitTransitionState
  onClose: () => void
}

export function HomeCoachmarkOverlay({ state, onClose }: HomeCoachmarkOverlayProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const step = HOME_COACHMARK_STEPS[stepIndex] ?? HOME_COACHMARK_STEPS[0]
  const layout = useCoachmarkLayout(hostRef, step)
  const isLastStep = stepIndex === HOME_COACHMARK_STEPS.length - 1
  // 퇴장 중에도 오버레이는 화면에 남는다 — 사라지는 동안 탭을 삼키지 않게 흘려보낸다.
  const isInteractive = state !== 'exiting'

  // 안내에 갇히지 않도록 안드로이드 back으로 언제든 빠져나갈 수 있게 한다.
  // 이 훅이 열려 있는 동안만 등록되도록 오버레이가 떠 있을 때만 마운트한다(HomeCoachmark 참고).
  useHardwareBack(onClose)

  const handleAction = () => {
    if (isLastStep) {
      onClose()
      return
    }
    setStepIndex((index) => index + 1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="홈 사용법 안내"
      data-state={state}
      className={cn(
        // 딤이 창 전체를 덮도록 fixed로 띄운다. 조상에 transform·filter가 없어 뷰포트 기준이 된다.
        'pointer-events-none fixed inset-0 z-50',
        'transition-opacity duration-fast ease-enter',
        'data-[state=entering]:opacity-0',
        'data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
      )}
    >
      {/* 다음/확인 말고는 아무것도 눌리지 않게 창 전체에서 탭을 받아 삼킨다.
          구멍은 그림자로 그린 것이라 자기 박스 안쪽만 눌리므로 이 층이 따로 필요하다. */}
      {layout && isInteractive && (
        <div aria-hidden="true" className="pointer-events-auto absolute inset-0" />
      )}

      {/* 좌표 기준은 창이 아니라 앱 셸이다 — 넓은 화면에서 말풍선이 셸 밖으로 밀려나지 않는다. */}
      <div ref={hostRef} className="relative mx-auto h-full w-full max-w-132.5">
        {/* 비출 대상을 못 찾으면 딤도 탭 차단도 그리지 않는다 — 홈이 그대로 동작한다. */}
        {layout && (
          <>
            {/* 딤은 구멍 밖으로 퍼지는 그림자다. 대상 위에 덧칠하지 않으니 원래 밝기 그대로 남는다. */}
            <div
              aria-hidden="true"
              className="absolute shadow-[0_0_0_9999px] shadow-bg-black/50"
              style={{
                borderRadius: layout.hole.radius,
                height: layout.hole.height,
                left: layout.hole.left,
                top: layout.hole.top,
                width: layout.hole.width,
              }}
            />

            <CoachmarkTooltip
              actionLabel={step.actionLabel}
              className={isInteractive ? 'pointer-events-auto' : undefined}
              description={step.description}
              position={layout.tooltip}
              stepCount={HOME_COACHMARK_STEPS.length}
              stepIndex={stepIndex}
              tailLeft={layout.tailLeft}
              onAction={handleAction}
            />
          </>
        )}
      </div>
    </div>
  )
}
