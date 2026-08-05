import type { ReportReason, ReportRequest } from '@/app/_global/_queries/report.queries'

import { REPORT_DETAIL_MAX_LENGTH } from '../_data/reportReason.constant'

/**
 * 신고를 제출할 수 있는 상태인지 판정한다.
 * 기타(ETC) 사유는 서버가 상세 내용을 필수(≤500자)로 요구한다 — 공백만 쓴 입력은 비운 것으로 본다.
 */
export function canSubmitReport(reason: ReportReason | null, detail: string): boolean {
  if (reason === null) return false
  if (reason !== 'ETC') return true
  const trimmed = detail.trim()
  return trimmed.length > 0 && trimmed.length <= REPORT_DETAIL_MAX_LENGTH
}

/**
 * 신고 요청 본문을 만든다. 상세 내용은 기타 사유일 때만 싣는다 —
 * 다른 사유에 detail을 실으면 서버 스펙 밖의 값이 남는다.
 */
export function buildReportRequest(reason: ReportReason, detail: string): ReportRequest {
  return reason === 'ETC' ? { reason, detail: detail.trim() } : { reason }
}
