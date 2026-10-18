import { describe, expect, it } from 'vitest'

import {
  buildNotificationHref,
  buildPushNotificationHref,
} from '@/app/_global/_services/notificationNavigation.service'

describe('notificationNavigation.service', () => {
  it('좋아요 알림은 의견이 포함된 책 화면으로 보낸다', () => {
    expect(
      buildNotificationHref({
        type: 'OPINION_LIKED',
        bookId: 11,
        opinionId: 7,
      }),
    ).toBe('/trace/11?opinionId=7')
  })

  it('댓글 알림은 commentId가 있어도 의견 기준으로 보낸다', () => {
    expect(
      buildPushNotificationHref({
        type: 'OPINION_COMMENTED',
        bookId: '11',
        opinionId: '7',
        commentId: '3',
      }),
    ).toBe('/trace/11?opinionId=7')
  })

  it('모임 의견 알림은 groupId를 함께 넘긴다', () => {
    expect(
      buildNotificationHref({
        type: 'OPINION_LIKED',
        bookId: 11,
        opinionId: 7,
        groupId: 3,
      }),
    ).toBe('/trace/11?opinionId=7&groupId=3')
  })

  it('책 신규 의견 알림은 책 화면으로 보낸다', () => {
    expect(
      buildNotificationHref({
        type: 'BOOK_NEW_OPINIONS',
        bookId: 11,
      }),
    ).toBe('/trace/11')
  })

  it('모임의 새 의견 알림은 groupId를 함께 넘긴다', () => {
    expect(
      buildNotificationHref({
        type: 'BOOK_NEW_OPINIONS',
        bookId: 11,
        groupId: 3,
      }),
    ).toBe('/trace/11?groupId=3')
  })

  it.each(['GROUP_JOINED', 'GROUP_MEMBER_JOINED', 'GROUP_SCHEDULE_CHANGED', 'GROUP_ENDING_SOON'])(
    '모임 알림 %s은 모임 탭으로 보낸다',
    (type) => {
      expect(buildNotificationHref({ type })).toBe('/meeting')
    },
  )

  it('이동에 필요한 id가 없으면 알림함으로 보낸다', () => {
    expect(buildNotificationHref({ type: 'OPINION_LIKED', opinionId: 7 })).toBe('/notifications')
    expect(buildNotificationHref({ type: 'BOOK_NEW_OPINIONS' })).toBe('/notifications')
    expect(buildPushNotificationHref(null)).toBe('/notifications')
  })
})
