import { describe, expect, it } from 'vitest'

import { ApiError } from '@/app/_global/_data/api.model'

import { MODERATION_MESSAGE } from '../_data/moderation.constant'
import {
  canDismissDialog,
  isMine,
  resolveReportErrorMessage,
} from '../_services/moderation.service'

function apiError(status: number) {
  return new ApiError(status, 'ANY', '서버가 거부했다')
}

describe('isMine', () => {
  it('내 id와 글쓴이 id가 같으면 내 글이다', () => {
    expect(isMine(10, 10)).toBe(true)
  })

  it('id가 다르면 남의 글이다', () => {
    expect(isMine(10, 2)).toBe(false)
  })

  it('내 id를 모르면(비로그인) 모두 남의 글로 본다 — 0번 사용자도 예외가 아니다', () => {
    expect(isMine(undefined, 2)).toBe(false)
    expect(isMine(undefined, 0)).toBe(false)
  })
})

describe('resolveReportErrorMessage', () => {
  it('4xx는 다시 시도해도 소용없다고 안내한다', () => {
    expect(resolveReportErrorMessage(apiError(400))).toBe(MODERATION_MESSAGE.reportRejected)
    expect(resolveReportErrorMessage(apiError(409))).toBe(MODERATION_MESSAGE.reportRejected)
    expect(resolveReportErrorMessage(apiError(499))).toBe(MODERATION_MESSAGE.reportRejected)
  })

  it('4xx 구간 밖은 잠시 후 다시 시도하라고 안내한다', () => {
    expect(resolveReportErrorMessage(apiError(399))).toBe(MODERATION_MESSAGE.reportFailure)
    expect(resolveReportErrorMessage(apiError(500))).toBe(MODERATION_MESSAGE.reportFailure)
  })

  it('ApiError가 아닌 실패(네트워크 등)도 다시 시도 안내로 본다', () => {
    expect(resolveReportErrorMessage(new Error('네트워크가 끊겼다'))).toBe(
      MODERATION_MESSAGE.reportFailure,
    )
    expect(resolveReportErrorMessage(undefined)).toBe(MODERATION_MESSAGE.reportFailure)
  })
})

describe('canDismissDialog', () => {
  it('요청이 나가지 않은 상태의 닫기 요청은 받아들인다', () => {
    expect(canDismissDialog(false, false)).toBe(true)
  })

  it('요청이 처리 중이면 닫지 않는다 — 결과 스낵바를 보고 닫힌다', () => {
    expect(canDismissDialog(false, true)).toBe(false)
  })

  it('여는 방향의 변화는 닫기가 아니다', () => {
    expect(canDismissDialog(true, false)).toBe(false)
    expect(canDismissDialog(true, true)).toBe(false)
  })
})
