import { queryOptions } from '@tanstack/react-query'

import type { NoticeResponse as GeneratedNoticeResponse } from '../_apis/_generated/models/noticeResponse'
import { getNotice, getNotices } from '../_apis/_generated/notice/notice'

/** feature 코드는 _apis를 직접 import할 수 없어 공지 타입을 여기서 재노출한다 */
export type NoticeResponse = GeneratedNoticeResponse

/** 공지는 몇 주 단위로 바뀐다 — 기본 60초보다 길게 잡아 재진입마다 다시 받지 않는다 */
const NOTICE_STALE_TIME = 5 * 60 * 1000

export const noticeQueries = {
  all: () => ['notice'] as const,
  // ponytail: 공지는 몇 건 수준이라 한 페이지로 끝낸다 — 100건을 넘으면 infiniteQueryOptions로 바꾼다.
  // 목록 응답이 본문까지 담고 있어 이 페이로드가 곧 상세 캐시다(detail의 initialData).
  list: () =>
    queryOptions({
      queryKey: [...noticeQueries.all(), 'list'],
      queryFn: () => getNotices({ page: 0, size: 100 }),
      staleTime: NOTICE_STALE_TIME,
    }),
  detail: (noticeId: number) =>
    queryOptions({
      queryKey: [...noticeQueries.all(), noticeId],
      queryFn: () => getNotice(noticeId),
      staleTime: NOTICE_STALE_TIME,
    }),
}
