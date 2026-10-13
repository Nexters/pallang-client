/**
 * 내 서재 항목의 식별·이동 규칙.
 *
 * 서버가 내 서재를 책 단위가 아니라 (책, 모임) 단위로 내려준다. 같은 책을 개인과 모임 양쪽에서 남기면
 * `bookId`가 같은 항목이 둘 온다 — bookId만으로 키를 잡거나 링크를 만들면 둘이 한 항목처럼 겹친다.
 * 홈 캐러셀과 마이페이지 내 서재가 같은 규칙을 써야 해서 한곳에 둔다.
 */

import { readPositiveInt } from '@/app/_global/_services/searchParams.service'

/** 항목을 가르는 두 값. 전역 항목은 groupId가 null이다. */
export type LibraryEntryRef = {
  bookId: number
  groupId?: number | null
}

/** 책 상세로 모임 범위를 실어 나르는 쿼리 키 — 만드는 쪽과 읽는 쪽이 어긋나지 않도록 한곳에 둔다 */
const GROUP_PARAM = 'groupId'

/**
 * 목록 key·복원 위치에 쓰는 항목 식별자.
 * 전역 항목은 bookId 그대로다 — 모임 구분이 생기기 전에 저장해 둔 복원 값(bookId)도 그대로 맞는다.
 */
export function getLibraryEntryKey({ bookId, groupId }: LibraryEntryRef): string {
  return groupId == null ? String(bookId) : `${String(bookId)}:${String(groupId)}`
}

/** 마이페이지 내 서재 → 책 상세. 모임 항목이면 그 모임 범위로 연다. */
export function buildLibraryBookHref({ bookId, groupId }: LibraryEntryRef): string {
  const path = `/my/library/${String(bookId)}`
  return groupId == null ? path : `${path}?${GROUP_PARAM}=${String(groupId)}`
}

/** 책 상세의 범위. 양의 정수가 아니면 전역 항목이다. */
export function parseLibraryGroupId(
  params: Record<string, string | string[] | undefined>,
): number | null {
  return readPositiveInt(params, GROUP_PARAM) ?? null
}
