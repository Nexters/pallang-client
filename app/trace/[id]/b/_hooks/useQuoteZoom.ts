import { type CSSProperties, type UIEvent, useCallback, useState } from 'react'

import {
  BANNER_HEIGHT,
  CARD_RISE,
  CARD_SCALE_EXPANDED,
  CARD_SCALE_GROWTH,
  CARD_TOP_COLLAPSED,
  COLLAPSE_DISTANCE,
  getCollapseProgress,
  HEADER_HEIGHT,
  INDICATOR_RISE,
  INDICATOR_TOP_EXPANDED,
  PANEL_HEIGHT,
  STAGE_COLLAPSED,
  STAGE_EXPANDED,
  TABS_HEIGHT,
} from '../_services/quoteZoom.service'

const px = (value: number) => `${String(value)}px`

// 시안 수치를 한 번만 CSS로 내보내 TS와 CSS의 값이 어긋나지 않게 한다
const stageStyle = {
  '--stage-expanded': px(STAGE_EXPANDED),
  '--stage-collapsed': px(STAGE_COLLAPSED),
  '--stage-shift': px(COLLAPSE_DISTANCE),
  '--header-height': px(HEADER_HEIGHT),
  '--tabs-height': px(TABS_HEIGHT),
  '--banner-height': px(BANNER_HEIGHT),
  '--panel-height': px(PANEL_HEIGHT),
  '--card-rise': px(CARD_RISE),
  '--card-top-collapsed': px(CARD_TOP_COLLAPSED),
  '--card-scale-expanded': String(CARD_SCALE_EXPANDED),
  '--card-scale-growth': String(CARD_SCALE_GROWTH),
  '--indicator-top-expanded': px(INDICATOR_TOP_EXPANDED),
  '--indicator-rise': px(INDICATOR_RISE),
} as CSSProperties

export function useQuoteZoom() {
  // 진행률 자체는 CSS 변수로만 흘려보내고, 마운트가 바뀌어야 하는 조각만 상태로 둔다
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget
    const progress = getCollapseProgress(scroller.scrollTop)
    scroller.style.setProperty('--collapse', String(progress))
    // 값이 같으면 React가 리렌더를 건너뛰므로 전환 중에는 리렌더가 일어나지 않는다
    setIsCollapsed(progress === 1)
  }, [])

  return { stageStyle, isCollapsed, handleScroll }
}
