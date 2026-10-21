/**
 * 책 목록(탐색·검색)에서 책을 눌렀을 때 어디로 보낼지 정하는 규칙.
 *
 * 목록 API는 모임 전용 대목까지 세서 책을 띄우지만, 흔적 화면을 groupId 없이 열면 공개 대목만 보인다.
 * 모임에서만 읽는 책을 그대로 열면 빈 카드만 남는다 — 그래서 공개 대목 → 내 모임 → 안내 순으로 갈 곳을 고른다.
 */

import type { GroupSummary } from '@/app/_global/_queries/group.queries'

/** 갈 곳을 정하는 데 필요한 책 정보. 안내 모달의 '공개로 의견 남기기'가 제목·표지를 작성 플로우로 넘긴다. */
export type BookEntryBook = {
  bookId: number
  title: string
  coverImageUrl?: string | null
  /** 공개 대목이 있는지. 응답에 값이 없는 목록(최근 남긴 책)은 undefined — 누를 때 대목을 조회해 가린다 */
  hasPublicPassage: boolean | undefined
}

export type BookEntry =
  | { kind: 'public' }
  | { kind: 'myGroup'; group: GroupSummary }
  | { kind: 'pickGroup'; groups: GroupSummary[] }
  | { kind: 'privateGroup' }

/**
 * 목록 응답에서 공개 대목 여부를 읽는다. 값을 안 실어 보내는 응답(최근 남긴 책, 필드가 배포되기 전 서버)은
 * undefined로 남겨 누를 때 조회하게 한다 — 0으로 읽으면 공개 기록이 있는 책까지 안내 모달로 막힌다.
 */
export function readHasPublicPassage(book: {
  bookId: number
  publicPassageCount?: number
}): boolean | undefined {
  return book.publicPassageCount === undefined ? undefined : book.publicPassageCount > 0
}

/** 이 책을 읽는 내 모임. 진행 중인 모임을 앞에 둔다 — 하나뿐이면 그리로 바로 가고, 여럿이면 시트 순서가 된다. */
export function findMyGroupsForBook(groups: GroupSummary[], bookId: number): GroupSummary[] {
  return groups
    .filter((group) => group.bookId === bookId)
    .sort((a, b) => Number(a.ended) - Number(b.ended))
}

export function resolveBookEntry({
  hasPublicPassage,
  myGroups,
}: {
  hasPublicPassage: boolean
  myGroups: GroupSummary[]
}): BookEntry {
  if (hasPublicPassage) return { kind: 'public' }
  const [first, ...rest] = myGroups
  if (!first) return { kind: 'privateGroup' }
  if (rest.length === 0) return { kind: 'myGroup', group: first }
  return { kind: 'pickGroup', groups: myGroups }
}
