/** 사용자가 고른 책 — 흔적 작성 초안과 모임 만들기 폼이 같은 모양으로 든다. 쪽수는 목록 응답에 없을 수 있어 null 허용. */
export type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}
