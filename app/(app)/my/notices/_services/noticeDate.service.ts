/** `2026-07-20T10:15:30`처럼 날짜로 시작하는 값만 받는다 */
const DATE_HEAD_PATTERN = /^\d{4}-\d{2}-\d{2}/
/** 끝에 붙은 `Z` 또는 `+09:00`·`-0500` 같은 오프셋 */
const ZONE_SUFFIX_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/

/** 공지 목록의 작성일 표기(`2026.07.20`). 읽을 수 없는 값은 빈 문자열로 흘린다. */
export function formatNoticeDate(createdAt: string): string {
  if (!DATE_HEAD_PATTERN.test(createdAt)) return ''

  // 오프셋이 붙어 오면 앞 10자는 UTC 기준이라 현지 날짜와 하루 어긋날 수 있다 — 파싱해서 옮긴다
  if (ZONE_SUFFIX_PATTERN.test(createdAt)) {
    const parsed = new Date(createdAt)
    return Number.isNaN(parsed.getTime()) ? '' : toDottedDate(parsed)
  }

  // 오프셋이 없으면 서버가 준 값이 이미 현지 날짜다 — 자르는 편이 파싱보다 안전하다
  return createdAt.slice(0, 10).replaceAll('-', '.')
}

function toDottedDate(date: Date): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
