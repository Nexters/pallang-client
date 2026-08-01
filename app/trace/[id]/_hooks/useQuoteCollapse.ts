import { type CSSProperties, type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { WIDTH_TIMING } from '../_data/widthTiming.constant'
import {
  BANNER_HEIGHT,
  CARD_HEIGHT,
  CARD_RISE,
  CARD_SHRINK,
  CARD_TOP_COLLAPSED,
  CARD_WIDTH,
  COLLAPSE_ANIMATION_MS,
  COLLAPSE_DISTANCE,
  easeOutCubic,
  getTransitionIntent,
  HEADER_HEIGHT,
  INDICATOR_RISE,
  INDICATOR_TOP_EXPANDED,
  STAGE_COLLAPSED,
  STAGE_EXPANDED,
  TABS_HEIGHT,
  TOUCH_COLLAPSE_DRAG,
  TOUCH_EXPAND_DRAG,
  WHEEL_TRIGGER_DELTA,
} from '../_services/quoteCollapse.service'

const px = (value: number) => `${String(value)}px`

// 시안 수치를 한 번만 CSS로 내보내 TS와 CSS의 값이 어긋나지 않게 한다
const stageStyle = {
  '--width-progress': WIDTH_TIMING,
  '--stage-expanded': px(STAGE_EXPANDED),
  '--stage-collapsed': px(STAGE_COLLAPSED),
  '--stage-shift': px(COLLAPSE_DISTANCE),
  '--header-height': px(HEADER_HEIGHT),
  '--tabs-height': px(TABS_HEIGHT),
  '--banner-height': px(BANNER_HEIGHT),
  '--card-width': px(CARD_WIDTH),
  '--card-height': px(CARD_HEIGHT),
  '--card-rise': px(CARD_RISE),
  '--card-shrink': px(CARD_SHRINK),
  '--card-top-collapsed': px(CARD_TOP_COLLAPSED),
  '--indicator-top-expanded': px(INDICATOR_TOP_EXPANDED),
  '--indicator-rise': px(INDICATOR_RISE),
} as CSSProperties

// 움직임 축소 설정에서는 전환을 즉시 끝낸다
function getAnimationDuration() {
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduced ? 1 : COLLAPSE_ANIMATION_MS
}

/** 포스트잇 ↔ 목록 전환. 스크럽이 아니라 제스처 한 번 = 상태 점프 한 번이다(#76).
    펼침 상태에서는 스크롤을 잠그고(isCollapsed=false → scrollerLocked) 아래로 스와이프하면 접힘으로,
    접힘 상태에서는 목록이 네이티브로 스크롤되고 최상단에서 아래로 당기면 펼침으로 돌아온다 */
export function useQuoteCollapse(scrollerRef: RefObject<HTMLDivElement | null>) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  // 제스처 판정은 이벤트 리스너 안에서 일어나므로 상태를 ref로도 든다
  const isCollapsedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const frameRef = useRef<number | null>(null)
  const touchStartYRef = useRef(0)
  const touchStartedAtTopRef = useRef(false)
  const touchHandledRef = useRef(false)

  const animateCollapse = useCallback(
    (target: 0 | 1) => {
      const scroller = scrollerRef.current
      if (!scroller) return
      const from = 1 - target
      const duration = getAnimationDuration()
      const startedAt = performance.now()
      isAnimatingRef.current = true

      const step = () => {
        const t = Math.min((performance.now() - startedAt) / duration, 1)
        const progress = from + (target - from) * easeOutCubic(t)
        scroller.style.setProperty('--collapse', String(progress))
        if (t < 1) {
          frameRef.current = requestAnimationFrame(step)
          return
        }
        isAnimatingRef.current = false
        // 접힘 확정은 애니메이션이 끝난 뒤에 — 그래야 목록 스크롤이 전환 완료 후에 풀린다
        if (target === 1) {
          isCollapsedRef.current = true
          setIsCollapsed(true)
        }
      }
      frameRef.current = requestAnimationFrame(step)
    },
    [scrollerRef],
  )

  const runTransition = useCallback(
    (intent: 'collapse' | 'expand') => {
      if (isAnimatingRef.current) return
      if (intent === 'collapse') {
        animateCollapse(1)
        return
      }
      // 펼침은 시작하자마자 잠가서(scrollerLocked) 애니메이션 중 목록이 밀리지 않게 한다
      isCollapsedRef.current = false
      setIsCollapsed(false)
      animateCollapse(0)
    },
    [animateCollapse],
  )

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const isListAtTop = () => scroller.scrollTop <= 0

    // 상세 오버레이는 fixed지만 스크롤러의 자손이라, 그 안의 스크롤이 여기까지 버블링돼 접힘/펼침을 일으킨다
    const isFromOverlay = (event: Event) =>
      event.target instanceof Element && event.target.closest('[role="dialog"]') !== null

    // 카드에서 가로로 축이 잡힌 제스처는 대목 스와이프(useQuoteSwipe)의 것이다.
    // 대각선 드래그 한 번이 접힘과 대목 이동을 동시에 일으키지 않도록 양보한다
    const isFromCardSwipe = (event: Event) =>
      event.target instanceof Element && event.target.closest('[data-swiping="true"]') !== null

    const handleWheel = (event: WheelEvent) => {
      if (isAnimatingRef.current || isFromOverlay(event)) return
      const intent = getTransitionIntent({
        isCollapsed: isCollapsedRef.current,
        scrollIntent: event.deltaY,
        isListAtTop: isListAtTop(),
        collapseThreshold: WHEEL_TRIGGER_DELTA,
        expandThreshold: WHEEL_TRIGGER_DELTA,
      })
      if (intent) runTransition(intent)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (isFromOverlay(event)) {
        // 오버레이에서 시작한 드래그는 이 제스처 내내 무시한다
        touchHandledRef.current = true
        return
      }
      touchStartYRef.current = event.touches[0]?.clientY ?? 0
      // 목록 중간에서 시작한 드래그가 최상단에 닿아도 펼치지 않도록 시작 위치를 함께 본다
      touchStartedAtTopRef.current = isListAtTop()
      touchHandledRef.current = false
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isAnimatingRef.current || touchHandledRef.current || isFromCardSwipe(event)) return
      const y = event.touches[0]?.clientY
      if (y === undefined) return
      const intent = getTransitionIntent({
        isCollapsed: isCollapsedRef.current,
        // 손가락을 위로 밀면(아래로 스크롤 의도) 양수
        scrollIntent: touchStartYRef.current - y,
        isListAtTop: touchStartedAtTopRef.current && isListAtTop(),
        collapseThreshold: TOUCH_COLLAPSE_DRAG,
        expandThreshold: TOUCH_EXPAND_DRAG,
      })
      if (intent) {
        // 한 제스처는 전환 한 번만 일으킨다
        touchHandledRef.current = true
        runTransition(intent)
      }
    }

    scroller.addEventListener('wheel', handleWheel, { passive: true })
    scroller.addEventListener('touchstart', handleTouchStart, { passive: true })
    scroller.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      scroller.removeEventListener('wheel', handleWheel)
      scroller.removeEventListener('touchstart', handleTouchStart)
      scroller.removeEventListener('touchmove', handleTouchMove)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [scrollerRef, runTransition])

  return { stageStyle, isCollapsed }
}
