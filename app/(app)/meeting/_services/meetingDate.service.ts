/** API·input[type=date]가 쓰는 'YYYY-MM-DD'만 날짜로 인정한다 — 문자열 비교가 곧 날짜 비교가 되는 형식이다 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value)
}

/** '2026-08-22' → '2026.08.22' (시안 카드·기간 필드 표기) */
export function formatDateDots(isoDate: string): string {
  return isoDate.replaceAll('-', '.')
}

/** 카드의 종료일 — 시안 "2026.08.22까지" */
export function formatMeetingDeadline(endDate: string): string {
  return `${formatDateDots(endDate)}까지`
}

/** 기간 필드에 보이는 값 — 시안에 포맷이 없어 점 표기 두 개를 물결로 잇는다 */
export function formatMeetingPeriod(startDate: string, endDate: string): string {
  return `${formatDateDots(startDate)} ~ ${formatDateDots(endDate)}`
}

/** 둘 다 형식이 맞고 시작 ≤ 종료(서버 GROUP_400_1 규칙)여야 기간이다. 같은 날은 허용한다. */
export function isValidMeetingPeriod(startDate: string, endDate: string): boolean {
  return isIsoDate(startDate) && isIsoDate(endDate) && startDate <= endDate
}
