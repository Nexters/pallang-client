/**
 * 흔적 보기 화면 → 흔적 작성 플로우로 넘기는 씨앗.
 *
 * 작성 초안(TraceDraftContext)은 `/trace/new` 레이아웃 안에서만 사는 Context라 바깥에서 채울 수 없다.
 * sessionStorage로 넘기면 하이드레이션 뒤에야 읽혀 그 전에 단계 가드가 빈 초안을 보고 첫 화면으로 되돌린다.
 * URL 쿼리는 렌더 시점에 읽히므로 그 경합이 없다.
 */

/** 씨앗을 실어 나르는 쿼리 키. 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다. */
const PARAM = {
  bookId: 'bookId',
  bookTitle: 'bookTitle',
  bookCover: 'bookCover',
  passageId: 'passageId',
  page: 'page',
  quote: 'quote',
  spoiler: 'spoiler',
} as const

/** 대목까지 물고 갈 때만 채운다. 없으면 책만 정해진 채 대목 입력부터 시작한다. */
export type TraceSeedPassage = {
  passageId: number
  pageNumber: number
  quotedText: string
  isSpoiler: boolean
}

export type TraceSeed = {
  bookId: number
  bookTitle: string
  bookCoverImageUrl: string | null
  passage: TraceSeedPassage | null
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/** 양의 정수만 통과시킨다 — '1.5', 'abc', '-3'은 모두 무효. */
function parsePositiveInt(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return parsed > 0 ? parsed : undefined
}

/** 흔적 작성 플로우로 보낼 링크. 대목을 함께 넘기면 꾸미기 단계부터 시작한다. */
export function buildTraceSeedHref(seed: TraceSeed): string {
  const params = new URLSearchParams({
    [PARAM.bookId]: String(seed.bookId),
    [PARAM.bookTitle]: seed.bookTitle,
  })
  if (seed.bookCoverImageUrl) params.set(PARAM.bookCover, seed.bookCoverImageUrl)
  if (seed.passage) {
    params.set(PARAM.passageId, String(seed.passage.passageId))
    params.set(PARAM.page, String(seed.passage.pageNumber))
    params.set(PARAM.quote, seed.passage.quotedText)
    if (seed.passage.isSpoiler) params.set(PARAM.spoiler, '1')
  }
  return `/trace/new?${params.toString()}`
}

/** 씨앗이 성립하지 않으면(책이 없으면) null. 대목은 네 값이 모두 갖춰졌을 때만 인정한다. */
export function parseTraceSeed(
  params: Record<string, string | string[] | undefined>,
): TraceSeed | null {
  const bookId = parsePositiveInt(readParam(params, PARAM.bookId))
  const bookTitle = readParam(params, PARAM.bookTitle)
  if (bookId === undefined || !bookTitle) return null

  const passageId = parsePositiveInt(readParam(params, PARAM.passageId))
  const pageNumber = parsePositiveInt(readParam(params, PARAM.page))
  const quotedText = readParam(params, PARAM.quote)

  return {
    bookId,
    bookTitle,
    bookCoverImageUrl: readParam(params, PARAM.bookCover) ?? null,
    passage:
      passageId !== undefined && pageNumber !== undefined && quotedText
        ? {
            passageId,
            pageNumber,
            quotedText,
            isSpoiler: readParam(params, PARAM.spoiler) === '1',
          }
        : null,
  }
}
