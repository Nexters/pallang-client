/**
 * 모임 만들기 화면으로 보던 책을 넘기는 규칙.
 * 책 목록의 안내 모달('새 모임 개설하기')이 만들고 모임 만들기 화면이 읽는다 — 둘이 다른 route라 여기 둔다.
 */

import { readPositiveInt } from '@/app/_global/_services/searchParams.service'

/** 미리 채울 책을 실어 나르는 쿼리 키 — 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다 */
const BOOK_PARAM = 'bookId'

/** 모임 만들기 링크. 책을 넘기면 책 칸이 그 책으로 채워진 채 열린다. */
export function buildMeetingCreateHref(bookId: number): string {
  return `/meeting/new?${BOOK_PARAM}=${String(bookId)}`
}

/** 미리 채울 책. 양의 정수가 아니면 빈 폼으로 연다. */
export function parseMeetingCreateBookId(
  params: Record<string, string | string[] | undefined>,
): number | null {
  return readPositiveInt(params, BOOK_PARAM) ?? null
}
