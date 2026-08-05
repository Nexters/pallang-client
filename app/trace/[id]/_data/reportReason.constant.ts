import type { ReportReason } from '@/app/_global/_queries/report.queries'

/** 서버 스펙(CreateReportRequest.detail maxLength)과 같은 값 — 기타 사유 상세 입력의 상한 */
export const REPORT_DETAIL_MAX_LENGTH = 500

export type ReportReasonOption = {
  id: string
  label: string
  reason: ReportReason
  /** 기타 — 사용자가 상세 사유를 직접 입력해야 제출할 수 있다 */
  requiresDetailInput?: boolean
}

/**
 * 신고 사유 선택지 — 확정 디자인(Figma 2872:16761)의 9종.
 * 서버 enum은 5종(SPAM/HATE/ABUSE/COPYRIGHT/ETC)뿐이라 직접 짝이 없는 사유는
 * ETC로 보내고 라벨을 detail에 싣는다(buildReportRequest). enum 확장은 백엔드와 협의할 것.
 * 순서가 곧 2열 그리드의 노출 순서다(좌→우, 위→아래, 기타는 마지막 전체 폭 행).
 */
export const REPORT_REASON_OPTIONS: ReportReasonOption[] = [
  { id: 'spoiler', label: '스포일러 미표시', reason: 'ETC' },
  { id: 'abuse', label: '욕설/인신공격', reason: 'ABUSE' },
  { id: 'obscenity', label: '음란성/선정성', reason: 'ETC' },
  { id: 'privacy', label: '개인정보노출', reason: 'ETC' },
  { id: 'spam', label: '홍보성 (스팸·광고)', reason: 'SPAM' },
  { id: 'off-topic', label: '책과 무관한 내용', reason: 'ETC' },
  { id: 'copyright', label: '저작권 침해', reason: 'COPYRIGHT' },
  { id: 'repeat', label: '같은 내용 반복 게시', reason: 'SPAM' },
  { id: 'etc', label: '기타', reason: 'ETC', requiresDetailInput: true },
]
