import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

/**
 * 내부 검색 결과 한 항목에서 우리가 쓰는 값만 추린 모양.
 * 응답 타입 전체에 매이지 않으려고 좁게 받는다 — 이 판단에 필요한 건 세 값뿐이다.
 */
export type BookDetailCandidate = {
  bookId: number
  author: string
  pageCount: number
}

/**
 * 세부(저자·쪽수)가 덜 찬 책인지. 판정 기준은 '저자가 비었는가' 하나다.
 *
 * 저자가 빈 책을 만드는 곳은 흔적 보기 화면이 넘기는 씨앗뿐이다 — 그 화면의 책 정보는
 * PageNumbers 응답에서 오는데 제목·표지밖에 없다(단일 도서 조회 API가 없다). 시트에서 고른
 * 책은 목록 응답이 저자를 함께 주므로 여기 걸리지 않는다.
 *
 * 쪽수만 비어도 덜 찼다고 보지는 않는다. 인기 목록에서 고른 책이 그런 모양인데(BookSearchSheetView가
 * 일부러 null로 둔다), 그건 시트에서 고른 책이라 이미 제 세부를 갖췄다고 본다 — 여기까지 넓히면
 * 가장 흔한 경로에서 매번 조회가 한 번 더 나간다.
 */
export function isBookDetailMissing(book: SelectedBook | null): boolean {
  return book !== null && book.author.trim().length === 0
}

/**
 * 제목으로 찾은 결과 중 같은 책(bookId 일치)을 고른다.
 * 제목이 같은 다른 판본이 섞여 오므로 제목이 아니라 bookId로만 맞춘다 — 못 찾으면 null이고,
 * 그때 초안은 그대로 둔다(이 채우기는 거들 뿐 막지 않는다).
 */
export function findBookDetail(
  candidates: readonly BookDetailCandidate[],
  bookId: number,
): BookDetailCandidate | null {
  return candidates.find((candidate) => candidate.bookId === bookId) ?? null
}
