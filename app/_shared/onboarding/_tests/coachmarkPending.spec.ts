import { beforeEach, describe, expect, it } from 'vitest'

import {
  consumeHomeCoachmarkPending,
  markHomeCoachmarkPending,
} from '../_services/coachmarkPending.service'

describe('coachmarkPending.service', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('예약이 없으면 소비할 것도 없다', () => {
    expect(consumeHomeCoachmarkPending()).toBe(false)
  })

  // 소비하지 않고 남겨 두면 홈에 들어올 때마다 코치마크가 다시 뜬다
  it('예약을 소비하면 그 자리에서 지워져 두 번 뜨지 않는다', () => {
    markHomeCoachmarkPending()

    expect(consumeHomeCoachmarkPending()).toBe(true)
    expect(consumeHomeCoachmarkPending()).toBe(false)
  })
})
