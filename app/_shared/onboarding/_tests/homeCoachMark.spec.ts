import { beforeEach, describe, expect, it } from 'vitest'

import {
  markHomeCoachMarkPending,
  markHomeCoachMarkSeen,
  shouldShowHomeCoachMark,
} from '../_services/homeCoachMark.service'

describe('homeCoachMark.service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('pending 상태가 아니면 코치마크를 보여주지 않는다', () => {
    expect(shouldShowHomeCoachMark()).toBe(false)
  })

  it('pending 상태면 코치마크를 보여준다', () => {
    markHomeCoachMarkPending()

    expect(shouldShowHomeCoachMark()).toBe(true)
  })

  it('본 것으로 기록하면 다시 보여주지 않는다', () => {
    markHomeCoachMarkPending()
    markHomeCoachMarkSeen()

    expect(shouldShowHomeCoachMark()).toBe(false)
  })
})
