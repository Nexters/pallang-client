/**
 * 목록 화면(내가 남긴 흔적·좋아요 누른 흔적) → 흔적 보기 화면의 특정 흔적으로 보내는 좌표.
 *
 * 흔적 보기(`/trace/[id]`)는 책 단위 화면이고, 그 안에서 페이지 → 대목 → 흔적 순으로 좁혀 들어간다.
 * 세 값이 다 있어야 그 흔적 하나를 열 수 있어 URL 쿼리로 함께 넘긴다.
 */

import { readPositiveInt } from '@/app/_global/_services/searchParams.service'

/** 좌표를 실어 나르는 쿼리 키. 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다. */
const PARAM = {
  page: 'page',
  passageId: 'passageId',
  opinionId: 'opinionId',
} as const

export type TraceTarget = {
  /** 책 안의 쪽 번호 — 페이지 탭이 이 값으로 열린다 */
  pageNumber: number
  passageId: number
  opinionId: number
}

/** 흔적 보기 화면에서 이 흔적 하나가 상세로 열린 채 시작하는 링크. */
export function buildTraceTargetHref(bookId: number, target: TraceTarget): string {
  const params = new URLSearchParams({
    [PARAM.page]: String(target.pageNumber),
    [PARAM.passageId]: String(target.passageId),
    [PARAM.opinionId]: String(target.opinionId),
  })
  return `/trace/${String(bookId)}?${params.toString()}`
}

/** 셋 중 하나라도 빠지면 좌표가 성립하지 않으므로 null — 화면은 평소대로 첫 페이지에서 시작한다. */
export function parseTraceTarget(
  params: Record<string, string | string[] | undefined>,
): TraceTarget | null {
  const pageNumber = readPositiveInt(params, PARAM.page)
  const passageId = readPositiveInt(params, PARAM.passageId)
  const opinionId = readPositiveInt(params, PARAM.opinionId)

  if (pageNumber === undefined || passageId === undefined || opinionId === undefined) return null
  return { pageNumber, passageId, opinionId }
}
