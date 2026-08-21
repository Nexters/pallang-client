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

/** 로컬 날짜 → 'YYYY-MM-DD' (toISOString은 UTC로 밀려 하루가 어긋난다) */
export function toIsoDate(date: Date): string {
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 달력 한 달 — 일요일 시작, 앞쪽 빈칸은 null. 6행 고정이라 달을 넘겨도 시트 높이가 튀지 않는다 */
export function buildMonthGrid(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: (string | null)[] = Array.from<null>({ length: first.getDay() }).fill(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIsoDate(new Date(year, monthIndex, day)))
  }
  while (cells.length < 42) cells.push(null)
  return cells
}

/**
 * 범위 탭 규칙 — 시작이 없거나 둘 다 있으면 새 시작, 시작만 있으면 그 뒤는 종료·그 앞은 시작 교체.
 * 같은 날 두 번 탭하면 하루짜리 기간이다.
 */
export function pickRangeDate(
  range: { startDate: string; endDate: string },
  date: string,
): { startDate: string; endDate: string } {
  if (!range.startDate || range.endDate) return { startDate: date, endDate: '' }
  if (date < range.startDate) return { startDate: date, endDate: '' }
  return { startDate: range.startDate, endDate: date }
}
