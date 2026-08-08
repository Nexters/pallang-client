import { describe, expect, it } from 'vitest'

import {
  REPORT_DETAIL_MAX_LENGTH,
  REPORT_REASON_OPTIONS,
  type ReportReasonOption,
} from '../_data/reportReason.constant'
import { buildReportRequest, canSubmitReport } from '../_services/reportForm.service'

function optionById(id: string): ReportReasonOption {
  const option = REPORT_REASON_OPTIONS.find((candidate) => candidate.id === id)
  if (!option) throw new Error(`없는 사유: ${id}`)
  return option
}

describe('canSubmitReport', () => {
  it('사유를 고르지 않으면 제출할 수 없다', () => {
    expect(canSubmitReport(null, '')).toBe(false)
    expect(canSubmitReport(null, '상세를 먼저 써도 소용없다')).toBe(false)
  })

  it('기타가 아닌 사유는 상세 없이 제출할 수 있다', () => {
    expect(canSubmitReport(optionById('abuse'), '')).toBe(true)
    expect(canSubmitReport(optionById('spam'), '')).toBe(true)
    expect(canSubmitReport(optionById('copyright'), '')).toBe(true)
    expect(canSubmitReport(optionById('spoiler'), '')).toBe(true)
  })

  it('기타 사유는 상세가 필수다 — 공백만 쓴 입력은 비운 것으로 본다', () => {
    expect(canSubmitReport(optionById('etc'), '')).toBe(false)
    expect(canSubmitReport(optionById('etc'), '   ')).toBe(false)
    expect(canSubmitReport(optionById('etc'), '무단 도용이에요')).toBe(true)
  })

  it('기타 상세가 상한(500자)을 넘으면 제출할 수 없다', () => {
    expect(canSubmitReport(optionById('etc'), 'a'.repeat(REPORT_DETAIL_MAX_LENGTH))).toBe(true)
    expect(canSubmitReport(optionById('etc'), 'a'.repeat(REPORT_DETAIL_MAX_LENGTH + 1))).toBe(false)
  })
})

describe('buildReportRequest', () => {
  it('서버 enum에 짝이 있는 사유는 그대로, 상세 없이 보낸다', () => {
    expect(buildReportRequest(optionById('abuse'), '남아 있던 입력')).toEqual({ reason: 'ABUSE' })
    expect(buildReportRequest(optionById('spam'), '')).toEqual({ reason: 'SPAM' })
    expect(buildReportRequest(optionById('repeat'), '')).toEqual({ reason: 'SPAM' })
    expect(buildReportRequest(optionById('copyright'), '')).toEqual({ reason: 'COPYRIGHT' })
  })

  it('enum에 짝이 없는 사유는 ETC + 화면 라벨을 상세로 보낸다', () => {
    expect(buildReportRequest(optionById('spoiler'), '')).toEqual({
      reason: 'ETC',
      detail: '스포일러 미표시',
    })
    expect(buildReportRequest(optionById('privacy'), '남아 있던 입력')).toEqual({
      reason: 'ETC',
      detail: '개인정보노출',
    })
  })

  it('기타는 앞뒤 공백을 정리한 사용자 입력을 상세로 보낸다', () => {
    expect(buildReportRequest(optionById('etc'), '  무단 도용이에요  ')).toEqual({
      reason: 'ETC',
      detail: '무단 도용이에요',
    })
  })
})
