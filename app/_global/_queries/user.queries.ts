import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import type { BookOptionResponse } from '../_apis/_generated/models/bookOptionResponse'
import type { GetFilterBooksType } from '../_apis/_generated/models/getFilterBooksType'
import type { LikedOpinionResponse } from '../_apis/_generated/models/likedOpinionResponse'
import type { ModifyProfileImageBody } from '../_apis/_generated/models/modifyProfileImageBody'
import type { MyOpinionResponse } from '../_apis/_generated/models/myOpinionResponse'
import type { MyPassageResponse } from '../_apis/_generated/models/myPassageResponse'
import type { UpdateNicknameRequest } from '../_apis/_generated/models/updateNicknameRequest'
import {
  getFilterBooks,
  getLikedOpinions,
  getMe,
  getMyOpinions,
  getMyPassages,
  modifyNickname,
  modifyProfileImage,
  withdraw,
} from '../_apis/_generated/user/user'
import { clearTokens } from '../_services/authToken.service'
import { markWithdrawalCompleted } from '../_services/withdrawal.service'

/** feature 코드는 _apis를 직접 import할 수 없어 목록 항목 타입을 여기서 재노출한다. */
export type UserOpinion = MyOpinionResponse

/** 좋아요 관리 화면의 목록 항목 — 내 흔적 목록과 달리 `nickname`·`likedAt`이 온다. */
export type LikedOpinion = LikedOpinionResponse

/** 스포일러 관리 화면의 목록 항목 — 흔적 본문 없이 대목 인용문(`quotedText`)만 온다. */
export type MyPassage = MyPassageResponse

/** 도서 필터 드롭다운의 옵션 하나. */
export type FilterBook = BookOptionResponse

/** 필터를 거는 관리 화면 종류(LIKE: 좋아요 관리, SPOILER: 스포일러 대목 관리). */
export type FilterBooksType = GetFilterBooksType

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
  /** 내가 남긴 흔적 전체 목록. */
  opinionList: () =>
    infiniteQueryOptions({
      queryKey: [...userQueries.all(), 'opinion-list'],
      queryFn: ({ pageParam }) => getMyOpinions({ page: pageParam, size: USER_OPINION_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  /** 좋아요 관리 화면의 목록 전체 — 도서 필터를 가리지 않고 함께 무효화할 때 쓴다 */
  likedOpinionListAll: () => [...userQueries.all(), 'liked-opinion-list'] as const,
  /**
   * 내가 좋아요를 누른 흔적 목록. `bookId`를 주면 그 책만 추린다.
   * 필터는 서버가 걸므로 queryKey에 넣어 책마다 따로 캐시한다.
   */
  likedOpinionList: (bookId?: number) =>
    infiniteQueryOptions({
      queryKey: [...userQueries.likedOpinionListAll(), bookId ?? 'all'],
      queryFn: ({ pageParam }) =>
        getLikedOpinions({ bookId, page: pageParam, size: USER_OPINION_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  /**
   * 내가 스포일러로 표시한 대목 목록. `bookId`를 주면 그 책만 추린다.
   * 필터는 서버가 걸므로 queryKey에 넣어 책마다 따로 캐시한다.
   */
  spoilerPassageList: (bookId?: number) =>
    infiniteQueryOptions({
      queryKey: [...userQueries.all(), 'spoiler-passage-list', bookId ?? 'all'],
      queryFn: ({ pageParam }) =>
        getMyPassages({
          bookId,
          spoilerOnly: true,
          page: pageParam,
          size: USER_OPINION_PAGE_SIZE,
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  /** 관리 화면 도서 필터의 선택지. */
  filterBooks: (type: FilterBooksType) =>
    queryOptions({
      queryKey: [...userQueries.all(), 'filter-books', type],
      queryFn: () => getFilterBooks({ type }),
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
