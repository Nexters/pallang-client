import { mutationOptions } from '@tanstack/react-query'

import type { CreateReportRequest } from '../_apis/_generated/models/createReportRequest'
import { reportComment, reportOpinion } from '../_apis/_generated/report/report'

/** feature 코드는 _apis를 직접 import할 수 없어 신고 요청 타입을 여기서 재노출한다 */
export type ReportRequest = CreateReportRequest
export type ReportReason = CreateReportRequest['reason']

export const reportMutations = {
  /** 흔적 신고. 본인 글·중복 신고는 서버가 4xx로 거부한다 — 호출부가 ApiError로 안내를 가른다 */
  opinion: (opinionId: number) =>
    mutationOptions({
      mutationKey: ['report', 'opinion', opinionId],
      mutationFn: (request: ReportRequest) => reportOpinion(opinionId, request),
    }),
  comment: (commentId: number) =>
    mutationOptions({
      mutationKey: ['report', 'comment', commentId],
      mutationFn: (request: ReportRequest) => reportComment(commentId, request),
    }),
}
