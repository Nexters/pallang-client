import type {
  GroupCreateInput,
  GroupDetail,
  GroupUpdateInput,
} from '@/app/_global/_queries/group.queries'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

import {
  MEETING_CAPACITY_DEFAULT,
  MEETING_CAPACITY_MAX,
  MEETING_CAPACITY_MIN,
  MEETING_NAME_MAX_LENGTH,
} from '../_data/meeting.constant'
import type { MeetingFormValues } from '../_types/meetingForm.type'
import { isValidMeetingPeriod } from './meetingDate.service'

export const emptyMeetingForm: MeetingFormValues = {
  name: '',
  capacity: MEETING_CAPACITY_DEFAULT,
  book: null,
  startDate: '',
  endDate: '',
}

export function isValidMeetingName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length > 0 && trimmed.length <= MEETING_NAME_MAX_LENGTH
}

function isValidCapacity(capacity: number, minCapacity: number): boolean {
  return (
    Number.isInteger(capacity) &&
    capacity >= Math.max(MEETING_CAPACITY_MIN, minCapacity) &&
    capacity <= MEETING_CAPACITY_MAX
  )
}

/**
 * CTA 활성 조건 한 벌 — 만들기·수정이 같은 함수를 쓴다(두 경로가 다른 비교를 하면 한쪽만 막힌다).
 * minCapacity는 수정 폼의 현재 참여 인원 — 서버가 409로 거절하는 값을 미리 막는다.
 */
export function isValidMeetingForm(
  values: MeetingFormValues,
  minCapacity = MEETING_CAPACITY_MIN,
): boolean {
  return (
    isValidMeetingName(values.name) &&
    values.book !== null &&
    isValidCapacity(values.capacity, minCapacity) &&
    isValidMeetingPeriod(values.startDate, values.endDate)
  )
}

export function toGroupCreateInput(
  values: MeetingFormValues & { book: SelectedBook },
): GroupCreateInput {
  return {
    name: values.name.trim(),
    bookId: values.book.bookId,
    capacity: values.capacity,
    startDate: values.startDate,
    endDate: values.endDate,
  }
}

/** 책은 생성 뒤 바꿀 수 없다(API) — 수정 요청에는 싣지 않는다 */
export function toGroupUpdateInput(values: MeetingFormValues): GroupUpdateInput {
  return {
    name: values.name.trim(),
    capacity: values.capacity,
    startDate: values.startDate,
    endDate: values.endDate,
  }
}

export function detailToMeetingForm(detail: GroupDetail): MeetingFormValues {
  return {
    name: detail.name,
    capacity: detail.capacity,
    book: {
      bookId: detail.bookId,
      title: detail.bookTitle,
      author: detail.bookAuthor,
      coverImageUrl: detail.bookCoverImageUrl ?? null,
      pageCount: null,
    },
    startDate: detail.startDate,
    endDate: detail.endDate,
  }
}
