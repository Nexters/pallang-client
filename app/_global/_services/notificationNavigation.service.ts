export const NOTIFICATION_FALLBACK_HREF = '/notifications'

type NotificationNavigationTarget = {
  type?: string | null
  bookId?: number | string | null
  opinionId?: number | string | null
  groupId?: number | string | null
}

function readPositiveInt(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0 ? value : null
  if (typeof value !== 'string') return null

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function readRecord(data: unknown): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

function readTargetFromData(data: unknown): NotificationNavigationTarget | null {
  const record = readRecord(data)
  if (!record) return null

  const type = record['type']
  const bookId = record['bookId']
  const opinionId = record['opinionId']
  const groupId = record['groupId']

  return {
    type: typeof type === 'string' ? type : null,
    bookId: typeof bookId === 'string' || typeof bookId === 'number' ? bookId : null,
    opinionId: typeof opinionId === 'string' || typeof opinionId === 'number' ? opinionId : null,
    groupId: typeof groupId === 'string' || typeof groupId === 'number' ? groupId : null,
  }
}

export function buildNotificationHref(target: NotificationNavigationTarget): string {
  const bookId = readPositiveInt(target.bookId)
  const opinionId = readPositiveInt(target.opinionId)
  const groupId = readPositiveInt(target.groupId)

  switch (target.type) {
    case 'OPINION_LIKED':
    case 'OPINION_COMMENTED':
      if (bookId === null || opinionId === null) return NOTIFICATION_FALLBACK_HREF
      return `/trace/${String(bookId)}?opinionId=${String(opinionId)}${
        groupId === null ? '' : `&groupId=${String(groupId)}`
      }`
    case 'BOOK_NEW_OPINIONS':
      if (bookId === null) return NOTIFICATION_FALLBACK_HREF
      return `/trace/${String(bookId)}${groupId === null ? '' : `?groupId=${String(groupId)}`}`
    case 'GROUP_JOINED':
    case 'GROUP_MEMBER_JOINED':
    case 'GROUP_SCHEDULE_CHANGED':
    case 'GROUP_ENDING_SOON':
      return '/meeting'
    default:
      return NOTIFICATION_FALLBACK_HREF
  }
}

export function buildPushNotificationHref(data: unknown): string {
  const target = readTargetFromData(data)
  return target ? buildNotificationHref(target) : NOTIFICATION_FALLBACK_HREF
}
