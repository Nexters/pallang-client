import { beforeEach, describe, expect, it } from 'vitest'

import { consumeMeetingNotice, markMeetingNotice } from '../_services/meetingNotice.service'

describe('모임 완료 알림 플래그', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })
  it('표시해 두면 한 번만 꺼내진다', () => {
    markMeetingNotice('created')
    expect(consumeMeetingNotice()).toBe('created')
    expect(consumeMeetingNotice()).toBeNull()
  })
  it('모르는 값은 무시한다', () => {
    window.sessionStorage.setItem('pallang.meetingNotice', 'weird')
    expect(consumeMeetingNotice()).toBeNull()
  })
})
