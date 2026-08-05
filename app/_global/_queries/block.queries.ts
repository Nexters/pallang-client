import { infiniteQueryOptions, mutationOptions } from '@tanstack/react-query'

import { block, getBlockedUsers, unblock } from '../_apis/_generated/block/block'
import type { BlockedUserResponse as GeneratedBlockedUserResponse } from '../_apis/_generated/models/blockedUserResponse'

/** feature 코드는 _apis를 직접 import할 수 없어 차단 사용자 타입을 여기서 재노출한다 */
export type BlockedUserResponse = GeneratedBlockedUserResponse

const BLOCKED_USER_PAGE_SIZE = 20

export const blockQueries = {
  all: () => ['block'] as const,
  /** 내가 차단한 사용자 목록(최신순) */
  list: () =>
    infiniteQueryOptions({
      queryKey: [...blockQueries.all(), 'list'],
      queryFn: ({ pageParam }) =>
        getBlockedUsers({ page: pageParam, size: BLOCKED_USER_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
}

/**
 * 차단/해제 성공 시 흔적·댓글 목록 무효화는 호출부가 맡는다 — 로그인 상태의 댓글·흔적 목록은
 * 서버가 차단 사용자의 글을 자동으로 걸러 주므로, 다시 받아와야 화면에서 사라진다(해제는 반대).
 */
export const blockMutations = {
  block: () =>
    mutationOptions({
      mutationKey: [...blockQueries.all(), 'create'],
      mutationFn: (userId: number) => block(userId),
    }),
  unblock: () =>
    mutationOptions({
      mutationKey: [...blockQueries.all(), 'remove'],
      mutationFn: (userId: number) => unblock(userId),
    }),
}
