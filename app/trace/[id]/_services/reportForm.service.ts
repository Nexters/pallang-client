import type { ReportRequest } from '@/app/_global/_queries/report.queries'

import { REPORT_DETAIL_MAX_LENGTH, type ReportReasonOption } from '../_data/reportReason.constant'

/**
 * 신고를 제출할 수 있는 상태인지 판정한다.
 * 직접 입력 사유(기타)만 상세가 필수(≤500자)다 — 공백만 쓴 입력은 비운 것으로 본다.
 */
export function canSubmitReport(option: ReportReasonOption | null, detail: string): boolean {
  if (option === null) return false
  if (!option.requiresDetailInput) return true
  const trimmed = detail.trim()
  return trimmed.length > 0 && trimmed.length <= REPORT_DETAIL_MAX_LENGTH
}

/**
 * 신고 요청 본문을 만든다. 서버의 ETC는 detail이 필수라서:
 * - 기타(직접 입력): 사용자가 쓴 상세를 싣는다
 * - enum 짝이 없는 사유(ETC 매핑): 화면 라벨을 detail로 싣는다 — 운영자가 사유를 식별할 수 있게
 * - enum 짝이 있는 사유: detail 없이 보낸다(서버 스펙 밖의 값이 남지 않게)
 */
export function buildReportRequest(option: ReportReasonOption, detail: string): ReportRequest {
  if (option.requiresDetailInput) return { reason: option.reason, detail: detail.trim() }
  if (option.reason === 'ETC') return { reason: 'ETC', detail: option.label }
  return { reason: option.reason }
}
