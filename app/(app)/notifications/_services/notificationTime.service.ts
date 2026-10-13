const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

/** 알림 시각을 "5분 전"처럼 지금 기준으로 읽는다. 일주일이 넘으면 날짜로 보여준다. */
export function formatNotificationTime(createdAt: string, now: Date = new Date()): string {
  const created = new Date(createdAt)
  const elapsed = now.getTime() - created.getTime()
  if (Number.isNaN(elapsed)) return ''

  // 기기 시계가 서버보다 늦으면 음수가 나온다 — 미래 시각이 아니라 방금 온 알림이다
  if (elapsed < MINUTE) return '방금 전'
  if (elapsed < HOUR) return `${String(Math.floor(elapsed / MINUTE))}분 전`
  if (elapsed < DAY) return `${String(Math.floor(elapsed / HOUR))}시간 전`
  if (elapsed < WEEK) return `${String(Math.floor(elapsed / DAY))}일 전`

  const month = String(created.getMonth() + 1).padStart(2, '0')
  const date = String(created.getDate()).padStart(2, '0')
  return `${String(created.getFullYear())}.${month}.${date}`
}
