export function formatTraceDate(createdAt: string, now: Date = new Date()): string {
  const hours = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 3_600_000)
  if (hours < 24) {
    return `${String(Math.max(hours, 1))}시간 전`
  }
  const days = Math.floor(hours / 24)
  if (days <= 3) {
    return `${String(days)}일 전`
  }
  return createdAt.slice(0, 10)
}

/** 좋아요·댓글 수 표기 — 99를 넘으면 99+로 줄인다 */
export function formatCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}
