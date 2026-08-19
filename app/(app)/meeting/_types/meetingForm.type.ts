import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

/** 만들기·수정 폼이 같은 그릇을 쓴다. 날짜는 API와 같은 'YYYY-MM-DD'(input[type=date] 값과도 같다). */
export type MeetingFormValues = {
  name: string
  capacity: number
  book: SelectedBook | null
  startDate: string
  endDate: string
}
