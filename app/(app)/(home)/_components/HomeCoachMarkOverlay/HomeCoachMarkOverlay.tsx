'use client'

import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { markHomeCoachMarkSeen } from '@/app/_shared/onboarding/_services/homeCoachMark.service'

import { HomeCoachMarkBubble } from '../HomeCoachMarkBubble/HomeCoachMarkBubble'

type HomeCoachMarkOverlayProps = {
  onFinish: () => void
}

type CoachMarkStep = {
  actionLabel: string
  bubblePlacement?: 'align-target-x'
  bubbleClassName: string
  copy: string
  cutoutClassName: string
  highlight?: 'trace-button'
  targetNames?: string[]
  tailLeft?: number
}

const COACH_MARK_STEPS: [CoachMarkStep, CoachMarkStep, CoachMarkStep] = [
  {
    actionLabel: '다음',
    bubbleClassName: 'bottom-[107px] left-1/2 -translate-x-1/2',
    copy: '+ 버튼을 클릭 해 현재 읽고 있거나,\n완독한 책에 의견을 남길 수 있어요.',
    cutoutClassName: 'bottom-4 left-1/2 h-14 w-20 -translate-x-1/2 rounded-full',
    highlight: 'trace-button',
  },
  {
    actionLabel: '다음',
    bubbleClassName: 'top-[104px] left-1/2 -translate-x-1/2',
    copy: '내가 남긴 책들은 메인에서 확인할 수\n있어요. 클릭 시 다른 사람이 남긴 의견도\n확인하고 서로 의견을 나눌 수 있는\n페이지로  넘어가요.',
    cutoutClassName: 'top-[266px] left-1/2 h-[418px] w-[220px] -translate-x-1/2 rounded-sm',
    targetNames: ['library-book-cover', 'library-book-info'],
  },
  {
    actionLabel: '확인',
    bubblePlacement: 'align-target-x',
    bubbleClassName: 'bottom-[107px] left-4',
    copy: '내가 남긴 책 외의 모든 책들은 “탐색"에서\n확인할 수 있어요. 다른 의견들을 확인해보면서 생각을 넓혀가보세요!',
    cutoutClassName: 'bottom-[17px] left-[84px] h-12 w-12 rounded-lg',
    targetNames: ['book-tab'],
    tailLeft: 82,
  },
]
const LAST_COACH_MARK_STEP = COACH_MARK_STEPS[2]
const TARGET_BUBBLE_GAP = 24
const COACH_MARK_ACTIVE_TARGET_ATTRIBUTE = 'data-home-coachmark-active'

function CoachMarkHighlight() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 flex h-14 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-interactive-accent px-4 py-3.5">
      <PlusIcon aria-hidden="true" className="size-6 text-icon-primary" />
    </div>
  )
}

export function HomeCoachMarkOverlay({ onFinish }: HomeCoachMarkOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [bubbleStyle, setBubbleStyle] = useState<CSSProperties | undefined>()
  const [dynamicTailLeft, setDynamicTailLeft] = useState<number | undefined>()
  const [cutoutStyle, setCutoutStyle] = useState<CSSProperties | undefined>()
  const step = COACH_MARK_STEPS[stepIndex] ?? LAST_COACH_MARK_STEP
  const bubblePlacement = step.bubblePlacement
  const targetNames = step.targetNames

  useLayoutEffect(() => {
    let frameId: number | undefined
    let activeTarget: Element | undefined

    const scheduleMeasure = () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId)

      frameId = window.requestAnimationFrame(() => {
        frameId = undefined

        if (!targetNames) {
          setBubbleStyle(undefined)
          setDynamicTailLeft(undefined)
          setCutoutStyle(undefined)
          return
        }

        const overlay = overlayRef.current
        if (!overlay) return

        const overlayRect = overlay.getBoundingClientRect()
        const targetElements = targetNames
          .map((targetName) =>
            document.querySelector(`[data-home-coachmark-target="${targetName}"]`),
          )
          .filter((element): element is Element => element !== null)
        const targetRects = targetElements.map((element) => element.getBoundingClientRect())

        if (targetRects.length === 0) return

        activeTarget?.removeAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE)
        activeTarget = targetElements[0]
        activeTarget?.setAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE, 'true')

        const left = Math.min(...targetRects.map((rect) => rect.left)) - overlayRect.left
        const top = Math.min(...targetRects.map((rect) => rect.top)) - overlayRect.top
        const right = Math.max(...targetRects.map((rect) => rect.right)) - overlayRect.left
        const bottom = Math.max(...targetRects.map((rect) => rect.bottom)) - overlayRect.top

        setCutoutStyle({
          height: bottom - top,
          left,
          top,
          width: right - left,
        })

        const bubble = bubbleRef.current
        if (!bubble) return

        if (bubblePlacement === 'align-target-x') {
          const bubbleRect = bubble.getBoundingClientRect()
          const targetCenterX = left + (right - left) / 2
          const bubbleLeft = Math.max(
            16,
            Math.min(overlayRect.width - bubbleRect.width - 16, targetCenterX - 92),
          )

          setBubbleStyle({
            bottom: 107,
            left: bubbleLeft,
          })
          setDynamicTailLeft(targetCenterX - bubbleLeft - 10)
          return
        }

        setDynamicTailLeft(undefined)
        setBubbleStyle({
          top: Math.max(0, top - bubble.getBoundingClientRect().height - TARGET_BUBBLE_GAP),
        })
      })
    }

    scheduleMeasure()

    if (!targetNames) {
      return () => {
        if (frameId !== undefined) window.cancelAnimationFrame(frameId)
        activeTarget?.removeAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE)
      }
    }

    const timeoutId = window.setTimeout(scheduleMeasure, 300)
    window.addEventListener('resize', scheduleMeasure)

    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId)
      activeTarget?.removeAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE)
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [bubblePlacement, targetNames])

  const handleAction = () => {
    if (stepIndex < COACH_MARK_STEPS.length - 1) {
      setStepIndex((index) => index + 1)
      return
    }

    markHomeCoachMarkSeen()
    onFinish()
  }
  const usesDynamicBubblePosition = bubblePlacement === 'align-target-x' && bubbleStyle

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-label="홈 사용 안내"
      className="absolute inset-0 z-50 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className={`absolute bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
          cutoutStyle ? 'rounded-sm' : step.cutoutClassName
        }`}
        style={cutoutStyle}
      />
      {step.highlight && <CoachMarkHighlight />}
      <HomeCoachMarkBubble
        actionLabel={step.actionLabel}
        className={`absolute ${usesDynamicBubblePosition ? '' : step.bubbleClassName}`}
        currentStep={stepIndex + 1}
        rootRef={bubbleRef}
        style={targetNames ? bubbleStyle : undefined}
        tailLeft={dynamicTailLeft ?? step.tailLeft}
        totalSteps={COACH_MARK_STEPS.length}
        onAction={handleAction}
      >
        {step.copy}
      </HomeCoachMarkBubble>
    </div>
  )
}
