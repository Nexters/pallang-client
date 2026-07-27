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

export function formatLikeCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}
