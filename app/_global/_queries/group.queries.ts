import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  createGroup,
  getGroupDetail,
  getGroupMembers,
  getInviteLink,
  getMyGroups,
  updateGroup,
} from '../_apis/_generated/group/group'
import type { CreateGroupRequest } from '../_apis/_generated/models/createGroupRequest'
import type { GroupDetailResponse } from '../_apis/_generated/models/groupDetailResponse'
import type { GroupMemberResponse } from '../_apis/_generated/models/groupMemberResponse'
import type { GroupSummaryResponse } from '../_apis/_generated/models/groupSummaryResponse'
import type { UpdateGroupRequest } from '../_apis/_generated/models/updateGroupRequest'

/** feature 코드는 _apis를 직접 import할 수 없어 응답/요청 타입을 여기서 재노출한다 */
export type GroupSummary = GroupSummaryResponse
export type GroupDetail = GroupDetailResponse
export type GroupMember = GroupMemberResponse
export type GroupCreateInput = CreateGroupRequest
export type GroupUpdateInput = UpdateGroupRequest

const GROUP_PAGE_SIZE = 20

export const groupQueries = {
  all: () => ['group'] as const,
  /** 내 모임 목록 — 최근 생성 순. 비로그인은 401이 정상 흐름이라 재시도하지 않는다(사용부가 enabled로 막는다). */
  list: () =>
    infiniteQueryOptions({
      queryKey: [...groupQueries.all(), 'list'],
      queryFn: ({ pageParam }) => getMyGroups({ page: pageParam, size: GROUP_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
      retry: false,
    }),
  detail: (groupId: number) =>
    queryOptions({
      queryKey: [...groupQueries.all(), 'detail', groupId],
      queryFn: () => getGroupDetail(groupId),
    }),
  /** 카드 아바타용 첫 페이지만 — 요약 응답에 멤버 프로필이 없어 카드마다 한 번 받는다 */
  members: (groupId: number, size: number) =>
    queryOptions({
      queryKey: [...groupQueries.all(), 'members', groupId, { size }],
      queryFn: () => getGroupMembers(groupId, { page: 0, size }),
    }),
  /** 모임장만 조회할 수 있다(403) — 공유 버튼을 누를 때만 fetchQuery로 받는다 */
  inviteLink: (groupId: number) =>
    queryOptions({
      queryKey: [...groupQueries.all(), 'invite-link', groupId],
      queryFn: () => getInviteLink(groupId),
      retry: false,
    }),
}

export const groupMutations = {
  create: () =>
    mutationOptions({
      mutationKey: [...groupQueries.all(), 'create'],
      mutationFn: (data: GroupCreateInput) => createGroup(data),
    }),
  update: (groupId: number) =>
    mutationOptions({
      mutationKey: [...groupQueries.all(), 'update', groupId],
      mutationFn: (data: GroupUpdateInput) => updateGroup(groupId, data),
    }),
}
