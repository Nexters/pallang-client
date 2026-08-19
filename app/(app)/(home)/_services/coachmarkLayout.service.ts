export type CoachmarkRect = {
  height: number
  left: number
  top: number
  width: number
}

export type CoachmarkLayout = {
  /** 딤에 뚫는 구멍. 좌표는 오버레이 기준이다. */
  hole: CoachmarkRect & { radius: number }
  /** 말풍선 꼬리의 왼쪽 위치(말풍선 기준). 꼬리 끝이 대상 중심을 가리킨다. */
  tailLeft: number
  /** 말풍선 위치(오버레이 기준). top이 아니라 bottom으로 잡아 말풍선 높이를 몰라도 된다. */
  tooltip: { bottom: number; left: number }
}

/** 시안 기준 말풍선 폭. CoachmarkTooltip의 w-62.5와 같은 값이다. */
export const COACHMARK_TOOLTIP_WIDTH = 250
/** 꼬리 폭. CoachmarkTooltip의 w-5와 같은 값이다. */
export const COACHMARK_TAIL_WIDTH = 20
/** 말풍선이 화면 가장자리에 붙을 때 남기는 여백 */
const TOOLTIP_EDGE_MARGIN = 16
/** 꼬리 끝과 대상 사이 간격 */
const TOOLTIP_TARGET_GAP = 24
/** 꼬리가 말풍선 모서리(rounded-lg 8px)를 넘어가지 않게 잡아 두는 여백 */
const TAIL_EDGE_MARGIN = 8

function clamp(value: number, min: number, max: number): number {
  // 클램프 범위가 뒤집힌 경우(말풍선보다 좁은 화면)에는 min을 우선한다
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

/** 여러 조각으로 나뉜 대상(예: 책 카드 + 그 아래 정보 행)을 하나의 구멍으로 합친다. */
export function unionRects(rects: CoachmarkRect[]): CoachmarkRect | null {
  const [first, ...rest] = rects
  if (!first) return null

  const bounds = rest.reduce(
    (acc, rect) => ({
      bottom: Math.max(acc.bottom, rect.top + rect.height),
      left: Math.min(acc.left, rect.left),
      right: Math.max(acc.right, rect.left + rect.width),
      top: Math.min(acc.top, rect.top),
    }),
    {
      bottom: first.top + first.height,
      left: first.left,
      right: first.left + first.width,
      top: first.top,
    },
  )

  return {
    height: bounds.bottom - bounds.top,
    left: bounds.left,
    top: bounds.top,
    width: bounds.right - bounds.left,
  }
}

/**
 * 대상 rect(뷰포트 기준)를 오버레이 기준 좌표로 옮기고 말풍선·꼬리 자리를 계산한다.
 *
 * 말풍선은 항상 대상 위에 서고 꼬리가 아래를 가리킨다(시안 3장 모두 그렇다).
 * 대상 중심에 맞추되 화면 밖으로 나가면 가장자리에서 멈추고, 그때도 꼬리만은
 * 대상 중심에 그대로 남아 어디를 가리키는지 흐려지지 않는다.
 */
export function getCoachmarkLayout({
  hostRect,
  radius,
  targetRect,
}: {
  hostRect: CoachmarkRect
  radius: number
  targetRect: CoachmarkRect
}): CoachmarkLayout {
  const left = targetRect.left - hostRect.left
  const top = targetRect.top - hostRect.top
  const centerX = left + targetRect.width / 2

  const tooltipLeft = clamp(
    centerX - COACHMARK_TOOLTIP_WIDTH / 2,
    TOOLTIP_EDGE_MARGIN,
    hostRect.width - TOOLTIP_EDGE_MARGIN - COACHMARK_TOOLTIP_WIDTH,
  )

  return {
    hole: { height: targetRect.height, left, radius, top, width: targetRect.width },
    tailLeft: clamp(
      centerX - tooltipLeft - COACHMARK_TAIL_WIDTH / 2,
      TAIL_EDGE_MARGIN,
      COACHMARK_TOOLTIP_WIDTH - TAIL_EDGE_MARGIN - COACHMARK_TAIL_WIDTH,
    ),
    tooltip: { bottom: hostRect.height - top + TOOLTIP_TARGET_GAP, left: tooltipLeft },
  }
}
