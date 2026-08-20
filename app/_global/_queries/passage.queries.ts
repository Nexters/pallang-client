import { infiniteQueryOptions, mutationOptions, queryOptions } from '@tanstack/react-query'

import type { CreateOcrResultBody } from '../_apis/_generated/models/createOcrResultBody'
import type { SimilarCheck } from '../_apis/_generated/models/similarCheck'
import {
  checkSimilarPassages,
  createOcrResult,
  getPageNumbers,
  getPassagesByPage,
  updateSpoiler,
} from '../_apis/_generated/passage/passage'

const PAGE_NUMBER_PAGE_SIZE = 100

/**
 * 서버 프리페치에서 요청 스코프 인증 헤더를 넣기 위한 fetch 옵션(브라우저에서는 생략).
 * queryKey에는 넣지 않는다 — 서버/클라이언트가 같은 캐시 엔트리를 공유해야 한다.
 */
type FetchOptions = Parameters<typeof getPageNumbers>[2]

export const passageQueries = {
  all: () => ['passage'] as const,
  pageNumbers: (bookId: number, groupId: number | undefined, options?: FetchOptions) =>
    infiniteQueryOptions({
      // 모임 전용 대목과 전역 대목은 다른 목록이다 — 키를 갈라 캐시가 섞이지 않게 한다
      queryKey: [...passageQueries.all(), 'page-numbers', bookId, groupId ?? null],
      queryFn: ({ pageParam }) =>
        getPageNumbers(bookId, { page: pageParam, size: PAGE_NUMBER_PAGE_SIZE, groupId }, options),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  passagesByPage: (
    bookId: number,
    page: number,
    groupId: number | undefined,
    options?: FetchOptions,
  ) =>
    queryOptions({
      queryKey: [...passageQueries.all(), 'by-page', bookId, page, groupId ?? null],
      queryFn: () => getPassagesByPage(bookId, page, { groupId }, options),
    }),
}

export const passageMutations = {
  all: () => ['passage'] as const,
  ocr: () =>
    mutationOptions({
      mutationKey: [...passageMutations.all(), 'ocr'],
      mutationFn: (data: CreateOcrResultBody) => createOcrResult(data),
    }),
  similarCheck: () =>
    mutationOptions({
      mutationKey: [...passageMutations.all(), 'similar-check'],
      mutationFn: (data: SimilarCheck) => checkSimilarPassages(data),
    }),
  /** 대목의 스포일러 표기 변경. 화면에는 해제(false)만 있지만 서버는 재설정도 받는다. */
  updateSpoiler: () =>
    mutationOptions({
      mutationKey: [...passageMutations.all(), 'update-spoiler'],
      mutationFn: ({ passageId, isSpoiler }: { passageId: number; isSpoiler: boolean }) =>
        updateSpoiler(passageId, { isSpoiler }),
    }),
}
