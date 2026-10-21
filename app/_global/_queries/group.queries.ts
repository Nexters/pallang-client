import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import {
  createGroup,
  getGroupDetail,
  getGroupMembers,
  getInviteLink,
  getMyGroups,
  joinGroup,
  previewInvitation,
  updateGroup,
} from '../_apis/_generated/group/group'
import type { CreateGroupRequest } from '../_apis/_generated/models/createGroupRequest'
import type { GroupDetailResponse } from '../_apis/_generated/models/groupDetailResponse'
import type { GroupInvitationPreviewResponse } from '../_apis/_generated/models/groupInvitationPreviewResponse'
import type { GroupMemberResponse } from '../_apis/_generated/models/groupMemberResponse'
import type { GroupSummaryResponse } from '../_apis/_generated/models/groupSummaryResponse'
import type { UpdateGroupRequest } from '../_apis/_generated/models/updateGroupRequest'

/** feature 코드는 _apis를 직접 import할 수 없어 응답/요청 타입을 여기서 재노출한다 */
export type GroupSummary = GroupSummaryResponse
export type GroupDetail = GroupDetailResponse
export type GroupMember = GroupMemberResponse
export type GroupInvitationPreview = GroupInvitationPreviewResponse
export type GroupCreateInput = CreateGroupRequest
export type GroupUpdateInput = UpdateGroupRequest

const GROUP_PAGE_SIZE = 20
/** 서버가 허용하는 한 페이지 최대치 — 전부 받아야 하는 조회는 요청 수를 줄이려 이 크기로 이어 받는다 */
const GROUP_PAGE_SIZE_MAX = 100

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
  /**
   * 내 모임 전부 — 책마다 내 모임이 있는지 가려야 하는 화면(탐색 목록·검색)용. 페이지를 끝까지 이어 받아 편다.
   * key를 list 아래에 둬서 모임을 만들거나 참여하며 list를 지우거나 갱신할 때 함께 걷힌다.
   */
  listAll: () =>
    queryOptions({
      queryKey: [...groupQueries.all(), 'list', 'all'],
      queryFn: async () => {
        const groups: GroupSummary[] = []
        // 다음 페이지 번호가 앞 응답의 hasNext로 정해져 순서대로 받을 수밖에 없다
        for (let page = 0; ; page += 1) {
          const response = await getMyGroups({ page, size: GROUP_PAGE_SIZE_MAX })
          groups.push(...(response.data?.groups ?? []))
          if (!response.data?.pageInfo.hasNext) return groups
        }
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
  /**
   * 초대 링크 랜딩의 가입 전 미리보기 — 인증은 선택이다. 로그인 상태면 customFetch가 토큰을 실어
   * `alreadyJoined`가 참값으로 내려오고, 비로그인이면 항상 false로 온다.
   * 잘못된 코드의 404는 정상 흐름(재시도해도 같은 답)이라 재시도하지 않는다.
   */
  invitationPreview: (inviteCode: string) =>
    queryOptions({
      queryKey: [...groupQueries.all(), 'invitation', inviteCode],
      queryFn: () => previewInvitation(inviteCode),
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
  /** 초대 코드로 가입 — 모임 id가 아니라 코드로 부른다(랜딩은 코드만 알고 있다) */
  join: () =>
    mutationOptions({
      mutationKey: [...groupQueries.all(), 'join'],
      mutationFn: (inviteCode: string) => joinGroup(inviteCode),
    }),
}
