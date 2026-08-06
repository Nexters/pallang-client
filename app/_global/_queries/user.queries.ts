import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import type { ModifyProfileImageBody } from '../_apis/_generated/models/modifyProfileImageBody'
import type { MyOpinionResponse } from '../_apis/_generated/models/myOpinionResponse'
import type { UpdateNicknameRequest } from '../_apis/_generated/models/updateNicknameRequest'
import {
  getLikedOpinions,
  getMe,
  getMyOpinions,
  modifyNickname,
  modifyProfileImage,
  withdraw,
} from '../_apis/_generated/user/user'
import { clearTokens } from '../_services/authToken.service'
import { markWithdrawalCompleted } from '../_services/withdrawal.service'

/** 흔적 목록 화면이 보는 범위 — 내가 쓴 것인지, 내가 좋아요를 누른 것인지 */
export type UserOpinionScope = 'liked' | 'mine'

/** feature 코드는 _apis를 직접 import할 수 없어 목록 항목 타입을 여기서 재노출한다.
    좋아요 목록은 `likedAt`이 더 붙을 뿐 목록 UI가 쓰는 필드는 같다. */
export type UserOpinion = MyOpinionResponse

const USER_OPINION_PAGE_SIZE = 20

export const userQueries = {
  all: () => ['user'] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'me'],
      queryFn: () => getMe(),
      // 비로그인이면 401이 정상 흐름이라 재시도하지 않는다
      retry: false,
    }),
  myOpinions: () =>
    queryOptions({
      queryKey: [...userQueries.all(), 'my-opinions'],
      // ponytail: size 10 고정 — 마이페이지 가로 스크롤 미리보기 용도, 전체 목록은 opinionList가 맡는다
      queryFn: () => getMyOpinions({ size: 10 }),
    }),
  /**
   * 내가 남긴 / 좋아요 누른 흔적 전체 목록. 두 응답은 `likedAt` 하나만 다르고 목록 UI가 쓰는 필드는
   * 같아서, 화면을 공유하는 만큼 쿼리도 scope 하나로 가른다.
   */
  opinionList: (scope: UserOpinionScope) =>
    infiniteQueryOptions({
      queryKey: [...userQueries.all(), 'opinion-list', scope],
      queryFn: ({ pageParam }) =>
        scope === 'mine'
          ? getMyOpinions({ page: pageParam, size: USER_OPINION_PAGE_SIZE })
          : getLikedOpinions({ page: pageParam, size: USER_OPINION_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
}

// 회원 탈퇴 확정: 서버 탈퇴 → 완료 플래그 → 로컬 토큰 정리.
// 서버 호출이 실패하면 토큰을 건드리지 않는다 — 세션이 살아 있어야 다시 시도할 수 있다.
// 플래그는 토큰을 비우기 전에 세운다. 토큰이 비는 순간 AuthProvider가 세션 만료로 판단해
// 로그인 화면으로 보내는데, 탈퇴는 비로그인 마이페이지로 가야 하기 때문이다.
// mutation/세션 성격이지만 auth.queries.ts의 signOut처럼 _apis 접근이 허용되는 이 계층에 둔다.
export async function withdrawAccount(): Promise<void> {
  await withdraw()
  markWithdrawalCompleted()
  await clearTokens()
}

export const userMutations = {
  all: () => ['user'] as const,
  modifyNickname: () =>
    mutationOptions({
      mutationKey: [...userMutations.all(), 'modify-nickname'],
      mutationFn: (request: UpdateNicknameRequest) => modifyNickname(request),
    }),
  modifyProfileImage: () =>
    mutationOptions({
      mutationKey: [...userMutations.all(), 'modify-profile-image'],
      mutationFn: (body: ModifyProfileImageBody) => modifyProfileImage(body),
    }),
  withdraw: () =>
    mutationOptions({
      mutationKey: [...userMutations.all(), 'withdraw'],
      mutationFn: () => withdrawAccount(),
    }),
}
