import { describe, expect, it } from 'vitest'

import { REPORT_DETAIL_MAX_LENGTH } from '../_data/reportReason.constant'
import { buildReportRequest, canSubmitReport } from '../_services/reportForm.service'

describe('canSubmitReport', () => {
  it('사유를 고르지 않으면 제출할 수 없다', () => {
    expect(canSubmitReport(null, '')).toBe(false)
    expect(canSubmitReport(null, '상세를 먼저 써도 소용없다')).toBe(false)
  })

  it('기타가 아닌 사유는 상세 없이 제출할 수 있다', () => {
    expect(canSubmitReport('SPAM', '')).toBe(true)
    expect(canSubmitReport('HATE', '')).toBe(true)
    expect(canSubmitReport('ABUSE', '')).toBe(true)
    expect(canSubmitReport('COPYRIGHT', '')).toBe(true)
  })

  it('기타 사유는 상세가 필수다 — 공백만 쓴 입력은 비운 것으로 본다', () => {
    expect(canSubmitReport('ETC', '')).toBe(false)
    expect(canSubmitReport('ETC', '   ')).toBe(false)
    expect(canSubmitReport('ETC', '무단 도용이에요')).toBe(true)
  })

  it('기타 상세가 상한(500자)을 넘으면 제출할 수 없다', () => {
    expect(canSubmitReport('ETC', 'a'.repeat(REPORT_DETAIL_MAX_LENGTH))).toBe(true)
    expect(canSubmitReport('ETC', 'a'.repeat(REPORT_DETAIL_MAX_LENGTH + 1))).toBe(false)
  })
})

describe('buildReportRequest', () => {
  it('기타 사유는 앞뒤 공백을 정리한 상세를 싣는다', () => {
    expect(buildReportRequest('ETC', '  무단 도용이에요  ')).toEqual({
      reason: 'ETC',
      detail: '무단 도용이에요',
    })
  })

  it('기타가 아닌 사유에는 상세를 싣지 않는다 — 서버 스펙 밖의 값이 남지 않게', () => {
    expect(buildReportRequest('SPAM', '남아 있던 입력')).toEqual({ reason: 'SPAM' })
  })
})
