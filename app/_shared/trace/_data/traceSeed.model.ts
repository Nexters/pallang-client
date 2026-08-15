/**
 * 흔적 보기 화면 → 흔적 작성 플로우로 넘기는 씨앗.
 *
 * 작성 초안(TraceDraftContext)은 `/trace/new` 레이아웃 안에서만 사는 Context라 바깥에서 채울 수 없다.
 * sessionStorage로 넘기면 하이드레이션 뒤에야 읽혀 그 전에 단계 가드가 빈 초안을 보고 첫 화면으로 되돌린다.
 * URL 쿼리는 렌더 시점에 읽히므로 그 경합이 없다.
 *
 * 씨앗은 책만 나른다 — 대목은 언제나 작성 플로우 안에서(OCR 또는 직접 입력으로) 새로 만든다.
 * 새 대목이 기존 대목과 같은지는 여기서 정하지 않고, 마지막 단계의 유사 대목 검사가 정한다.
 */

import { readParam, readPositiveInt } from '@/app/_global/_services/searchParams.service'

/** 씨앗을 실어 나르는 쿼리 키. 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다. */
const PARAM = {
  bookId: 'bookId',
  bookTitle: 'bookTitle',
  bookCover: 'bookCover',
} as const

export type TraceSeed = {
  bookId: number
  bookTitle: string
  bookCoverImageUrl: string | null
}

/** 흔적 작성 플로우로 보낼 링크. */
export function buildTraceSeedHref(seed: TraceSeed): string {
  const params = new URLSearchParams({
    [PARAM.bookId]: String(seed.bookId),
    [PARAM.bookTitle]: seed.bookTitle,
  })
  if (seed.bookCoverImageUrl) params.set(PARAM.bookCover, seed.bookCoverImageUrl)
  return `/trace/new?${params.toString()}`
}

/** 씨앗이 성립하지 않으면(책이 없으면) null. */
export function parseTraceSeed(
  params: Record<string, string | string[] | undefined>,
): TraceSeed | null {
  const bookId = readPositiveInt(params, PARAM.bookId)
  const bookTitle = readParam(params, PARAM.bookTitle)
  if (bookId === undefined || !bookTitle) return null

  return {
    bookId,
    bookTitle,
    bookCoverImageUrl: readParam(params, PARAM.bookCover) ?? null,
  }
}
