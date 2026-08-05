import type { ReportReason } from '@/app/_global/_queries/report.queries'

/** 서버 스펙(CreateReportRequest.detail maxLength)과 같은 값 — 기타 사유 상세 입력의 상한 */
export const REPORT_DETAIL_MAX_LENGTH = 500

/** 신고 사유 선택지 — 서버 enum과 화면 문구의 짝. 순서가 곧 시트의 노출 순서다 */
export const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: '스팸/홍보' },
  { value: 'HATE', label: '혐오 발언' },
  { value: 'ABUSE', label: '욕설/비방' },
  { value: 'COPYRIGHT', label: '저작권 침해' },
  { value: 'ETC', label: '기타' },
]
