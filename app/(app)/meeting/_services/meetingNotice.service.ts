import {
  getSessionStorageItem,
  removeSessionStorageItem,
  setSessionStorageItem,
} from '@/app/_global/_utils/sessionStorage'

/**
 * 만들기/수정 화면이 목록으로 돌아온 뒤 스낵바를 한 번 띄우기 위한 표시.
 * URL 쿼리로 넘기면 새로고침마다 다시 뜨고, 전역 토스트 스토어는 없다 — 탈퇴 완료 스낵바(withdrawal.service)와 같은 방식.
 */
const MEETING_NOTICE_KEY = 'pallang.meetingNotice'

export type MeetingNoticeKind = 'created' | 'updated'

export function markMeetingNotice(kind: MeetingNoticeKind): void {
  setSessionStorageItem(MEETING_NOTICE_KEY, kind)
}

export function consumeMeetingNotice(): MeetingNoticeKind | null {
  const value = getSessionStorageItem(MEETING_NOTICE_KEY)
  if (value === null) return null
  removeSessionStorageItem(MEETING_NOTICE_KEY)
  return value === 'created' || value === 'updated' ? value : null
}
