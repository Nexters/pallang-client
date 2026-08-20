import { describe, expect, it } from 'vitest'

import type { GroupDetail } from '@/app/_global/_queries/group.queries'

import {
  detailToMeetingForm,
  emptyMeetingForm,
  isValidMeetingForm,
  isValidMeetingName,
  toGroupCreateInput,
  toGroupUpdateInput,
} from '../_services/meetingForm.service'

const book = {
  bookId: 7,
  title: '프랑켄슈타인',
  author: '메리 셸리',
  coverImageUrl: null,
  pageCount: null,
}
const filled = {
  name: '고전 뽀개기',
  capacity: 4,
  book,
  startDate: '2026-08-20',
  endDate: '2026-09-20',
}

describe('모임 폼 규칙', () => {
  it('모임명은 공백을 뺀 1~15자', () => {
    expect(isValidMeetingName('')).toBe(false)
    expect(isValidMeetingName('   ')).toBe(false)
    expect(isValidMeetingName('열다섯글자열다섯글자열다섯글')).toBe(true) // 15자
    expect(isValidMeetingName('열여섯글자열여섯글자열여섯글자열')).toBe(false) // 16자
  })
  it('모임명·책·인원·기간이 모두 차야 제출할 수 있다', () => {
    expect(isValidMeetingForm(emptyMeetingForm)).toBe(false)
    expect(isValidMeetingForm(filled)).toBe(true)
    expect(isValidMeetingForm({ ...filled, book: null })).toBe(false)
    expect(isValidMeetingForm({ ...filled, endDate: '' })).toBe(false)
    expect(isValidMeetingForm({ ...filled, capacity: 11 })).toBe(false)
    expect(isValidMeetingForm({ ...filled, capacity: 1 })).toBe(false)
  })
  it('수정 폼은 현재 인원보다 적은 정원을 거절한다', () => {
    expect(isValidMeetingForm({ ...filled, capacity: 3 }, 4)).toBe(false)
    expect(isValidMeetingForm({ ...filled, capacity: 4 }, 4)).toBe(true)
  })
  it('생성 요청은 공백을 다듬고 bookId를 싣는다', () => {
    expect(toGroupCreateInput({ ...filled, name: ' 고전 뽀개기 ' })).toEqual({
      name: '고전 뽀개기',
      bookId: 7,
      capacity: 4,
      startDate: '2026-08-20',
      endDate: '2026-09-20',
    })
  })
  it('수정 요청에는 책이 없다(책은 바꿀 수 없다)', () => {
    expect(toGroupUpdateInput(filled)).toEqual({
      name: '고전 뽀개기',
      capacity: 4,
      startDate: '2026-08-20',
      endDate: '2026-09-20',
    })
  })
  it('상세 응답을 폼 값으로 편다', () => {
    const detail: GroupDetail = {
      groupId: 1,
      name: '주말 독서 모임',
      bookId: 7,
      bookTitle: '모순',
      bookAuthor: '양귀자',
      bookCoverImageUrl: null,
      hostUserId: 1,
      hostNickname: '여백이',
      capacity: 2,
      memberCount: 2,
      startDate: '2026-08-20',
      endDate: '2026-08-22',
      ended: false,
      isHost: true,
    }
    expect(detailToMeetingForm(detail)).toEqual({
      name: '주말 독서 모임',
      capacity: 2,
      book: { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: null },
      startDate: '2026-08-20',
      endDate: '2026-08-22',
    })
  })
})
