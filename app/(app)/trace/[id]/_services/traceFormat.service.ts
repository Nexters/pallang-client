type FormatTraceDateOptions = {
  /**
   * 하이드레이션이 끝났는지(기본 true). 프리렌더에는 현재 시각이 없어 상대 표기를 만들 수 없다 —
   * false면 결정적인 날짜로만 그려 서버와 클라이언트가 같은 글자를 내놓게 한다.
   */
  isHydrated?: boolean
  /** 상대 표기의 기준 시각 */
  now?: Date
}

/** 3일이 지난 뒤의 표기 — 프리렌더에서 쓰는 결정적인 값이기도 하다 */
function formatDateOnly(createdAt: string): string {
  return createdAt.slice(0, 10)
}

/**
 * 흔적·댓글의 작성 시각 표기. 하루 안이면 시간, 3일까지는 일, 그 뒤로는 yyyy-mm-dd다.
 * 기준 시각만 바꾸고 싶으면 두 번째 인자로 Date를 그대로 넘겨도 된다.
 */
export function formatTraceDate(
  createdAt: string,
  optionsOrNow: FormatTraceDateOptions | Date = {},
): string {
  const options: FormatTraceDateOptions =
    optionsOrNow instanceof Date ? { now: optionsOrNow } : optionsOrNow
  const { isHydrated = true, now = new Date() } = options

  if (!isHydrated) {
    return formatDateOnly(createdAt)
  }
  const hours = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 3_600_000)
  if (hours < 24) {
    return `${String(Math.max(hours, 1))}시간 전`
  }
  const days = Math.floor(hours / 24)
  if (days <= 3) {
    return `${String(days)}일 전`
  }
  return formatDateOnly(createdAt)
}

/** 좋아요·댓글 수 표기 — 99를 넘으면 99+로 줄인다 */
export function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}
