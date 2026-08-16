import { ApiError } from '@/app/_global/_data/api.model'

import { CLIENT_ERROR_STATUS, MODERATION_MESSAGE } from '../_data/moderation.constant'

/**
 * 글쓴이가 나인지 판정한다.
 * 비로그인이면 me가 없어(myUserId === undefined) 모두 남의 글로 본다 —
 * 신고·차단은 어차피 로그인 게이트가 먼저 막는다.
 */
export function isMine(myUserId: number | undefined, authorUserId: number): boolean {
  return myUserId !== undefined && myUserId === authorUserId
}

/** 4xx는 본인 글이거나 이미 신고한 글 — 다시 시도해도 결과가 같다 */
function isClientError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status >= CLIENT_ERROR_STATUS.min &&
    error.status < CLIENT_ERROR_STATUS.maxExclusive
  )
}

/** 신고 실패 원인을 안내 문구로 옮긴다 */
export function resolveReportErrorMessage(error: unknown): string {
  return isClientError(error) ? MODERATION_MESSAGE.reportRejected : MODERATION_MESSAGE.reportFailure
}

/**
 * 백드롭·Esc로 온 닫기 요청을 받아들일지 판정한다.
 * 요청이 나간 뒤에는 닫지 않는다 — 결과 스낵바를 보고 닫힌다.
 */
export function canDismissDialog(nextOpen: boolean, isPending: boolean): boolean {
  return !nextOpen && !isPending
}
