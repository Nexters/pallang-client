'use client'

import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'

import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'
import { cn } from '@/app/_global/_services/cn.service'
import { markHomeCoachMarkSeen } from '@/app/_shared/onboarding/_services/homeCoachMark.service'

import { HomeCoachMarkBubble } from '../HomeCoachMarkBubble/HomeCoachMarkBubble'

type HomeCoachMarkOverlayProps = {
  onFinish: () => void
}

type CoachMarkStep = {
  actionLabel: string
  copy: string
  /** 구멍 모서리 — 비추는 엘리먼트의 실제 모양을 따라간다 */
  cutoutRadiusClassName: string
  /** 찾아낸 엘리먼트를 모두 합친 사각형이 구멍이 된다 */
  targetNames: [string, ...string[]]
}

const COACH_MARK_STEPS: [CoachMarkStep, CoachMarkStep, CoachMarkStep] = [
  {
    actionLabel: '다음',
    copy: '+ 버튼을 클릭 해 현재 읽고 있거나,\n완독한 책에 의견을 남길 수 있어요.',
    cutoutRadiusClassName: 'rounded-full',
    targetNames: ['trace-button'],
  },
  {
    actionLabel: '다음',
    copy: '내가 남긴 책들은 메인에서 확인할 수\n있어요. 클릭 시 다른 사람이 남긴 의견도\n확인하고 서로 의견을 나눌 수 있는\n페이지로 넘어가요.',
    cutoutRadiusClassName: 'rounded-sm',
    targetNames: ['library-book-cover', 'library-book-info'],
  },
  {
    actionLabel: '확인',
    copy: '내가 남긴 책 외의 모든 책들은 “탐색”에서\n확인할 수 있어요. 다른 의견들을 확인해보면서 생각을 넓혀가보세요!',
    cutoutRadiusClassName: 'rounded-lg',
    targetNames: ['book-tab'],
  },
]

const LAST_COACH_MARK_STEP = COACH_MARK_STEPS[2]
/** 꼬리 끝과 대상 사이 간격 */
const TARGET_BUBBLE_GAP = 24
/** 말풍선이 화면 가장자리에 붙을 때 남기는 여백 */
const BUBBLE_EDGE_MARGIN = 16
/** 꼬리 폭 — HomeCoachMarkBubble의 border-x-[10px] 두 배다 */
const BUBBLE_TAIL_WIDTH = 20
/** 책 목록이 늦게 도착하거나 안드로이드가 하단 인셋을 늦게 덮어쓸 때를 위한 재측정 */
const REMEASURE_DELAY_MS = 300
const COACH_MARK_ACTIVE_TARGET_ATTRIBUTE = 'data-home-coachmark-active'

type CoachMarkPlacement = {
  bubbleStyle: CSSProperties
  cutoutStyle: CSSProperties
  tailLeft: number
}

export function HomeCoachMarkOverlay({ onFinish }: HomeCoachMarkOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [placement, setPlacement] = useState<CoachMarkPlacement | null>(null)
  const step = COACH_MARK_STEPS[stepIndex] ?? LAST_COACH_MARK_STEP
  const targetNames = step.targetNames

  const finish = () => {
    markHomeCoachMarkSeen()
    onFinish()
  }

  // 안내에 갇히지 않도록 안드로이드 back으로 언제든 빠져나갈 수 있게 한다.
  // 가로채지 않으면 기본 동작이 히스토리를 되감아 안내 도중 다른 화면으로 튄다.
  useHardwareBack(finish)

  // 좌표는 전부 실제 엘리먼트에서 잰다. 시안(375px) 좌표를 박아 두면 폭이 다른 기기에서
  // 어긋나고, 특히 탭바는 pb-(--safe-bottom)으로 늘어나므로 하단 고정값은 홈 인디케이터가
  // 있는 기기에서 구멍이 진짜 버튼을 벗어난다.
  useLayoutEffect(() => {
    let activeTarget: Element | null = null

    const measure = () => {
      const overlay = overlayRef.current
      const bubble = bubbleRef.current
      if (!overlay || !bubble) return

      const targetElements = targetNames
        .map((targetName) => document.querySelector(`[data-home-coachmark-target="${targetName}"]`))
        .filter((element): element is Element => element !== null)
      const [firstTarget] = targetElements
      if (!firstTarget) return

      const overlayRect = overlay.getBoundingClientRect()
      const targetRects = targetElements.map((element) => element.getBoundingClientRect())
      const left = Math.min(...targetRects.map((rect) => rect.left)) - overlayRect.left
      const top = Math.min(...targetRects.map((rect) => rect.top)) - overlayRect.top
      const right = Math.max(...targetRects.map((rect) => rect.right)) - overlayRect.left
      const bottom = Math.max(...targetRects.map((rect) => rect.bottom)) - overlayRect.top

      // 비활성 탭은 opacity-60이라 구멍만 뚫으면 흐린 채로 남는다 — 비추는 동안 원래 밝기로 되돌린다
      if (activeTarget !== firstTarget) {
        activeTarget?.removeAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE)
        activeTarget = firstTarget
        activeTarget.setAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE, 'true')
      }

      const bubbleRect = bubble.getBoundingClientRect()
      const targetCenterX = left + (right - left) / 2
      // 대상 중심에 맞추되 화면 밖으로 나가면 여백에서 멈춘다. 그때도 꼬리는 대상 중심에 남아
      // 어디를 가리키는지 흐려지지 않는다.
      const bubbleLeft = Math.max(
        BUBBLE_EDGE_MARGIN,
        Math.min(
          overlayRect.width - bubbleRect.width - BUBBLE_EDGE_MARGIN,
          targetCenterX - bubbleRect.width / 2,
        ),
      )

      setPlacement({
        // 말풍선 높이에 꼬리가 포함돼 있어 이 top이면 꼬리 끝이 대상 위 24px에 선다
        bubbleStyle: { left: bubbleLeft, top: top - bubbleRect.height - TARGET_BUBBLE_GAP },
        cutoutStyle: { height: bottom - top, left, top, width: right - left },
        tailLeft: targetCenterX - bubbleLeft - BUBBLE_TAIL_WIDTH / 2,
      })
    }

    // 첫 페인트 전에 한 번 재 두어야 딤이 엉뚱한 자리에 잠깐 그려지지 않는다
    measure()
    const frameId = window.requestAnimationFrame(measure)
    const timeoutId = window.setTimeout(measure, REMEASURE_DELAY_MS)
    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      window.removeEventListener('resize', measure)
      activeTarget?.removeAttribute(COACH_MARK_ACTIVE_TARGET_ATTRIBUTE)
    }
  }, [targetNames])

  const handleAction = () => {
    if (stepIndex < COACH_MARK_STEPS.length - 1) {
      setStepIndex((index) => index + 1)
      return
    }

    finish()
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="홈 사용 안내"
      className="absolute inset-0 z-50 overflow-hidden"
    >
      {placement && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]',
            step.cutoutRadiusClassName,
          )}
          style={placement.cutoutStyle}
        />
      )}
      {/* 말풍선은 높이를 재야 위치가 나오므로 항상 렌더하고, 자리를 잡기 전까지만 감춘다 */}
      <HomeCoachMarkBubble
        actionLabel={step.actionLabel}
        className={cn(
          'absolute transition-opacity duration-fast ease-enter',
          !placement && 'opacity-0',
        )}
        currentStep={stepIndex + 1}
        rootRef={bubbleRef}
        style={placement?.bubbleStyle}
        tailLeft={placement?.tailLeft}
        totalSteps={COACH_MARK_STEPS.length}
        onAction={handleAction}
      >
        {step.copy}
      </HomeCoachMarkBubble>
    </div>
  )
}
