import { infiniteQueryOptions, mutationOptions } from '@tanstack/react-query'

import {
  createComment,
  getComments,
  getReplies,
  modifyComment,
  removeComment,
} from '../_apis/_generated/comment/comment'
import type { CommentResponse as GeneratedCommentResponse } from '../_apis/_generated/models/commentResponse'
import type { RootCommentResponse as GeneratedRootCommentResponse } from '../_apis/_generated/models/rootCommentResponse'

/** feature 코드는 _apis를 직접 import할 수 없어 댓글 응답 타입을 여기서 재노출한다 */
export type CommentResponse = GeneratedCommentResponse
export type RootCommentResponse = GeneratedRootCommentResponse

/** 디자인 확정치 — 댓글·답글 모두 5개까지 보이고 더보기를 누를 때마다 5개씩 늘어난다 */
export const COMMENT_PAGE_SIZE = 5

/**
 * 서버가 원댓글 응답의 `replies`에 고정으로 실어 주는 답글 미리보기 개수 — 요청으로 조정할 수 없다
 * (_apis/_generated/comment/comment.ts의 getComments 설명: "각 원댓글에는 답글이 최대 5개까지
 * 미리보기로 포함됩니다"). 답글 요청은 이 구간 바로 뒤에서 이어 받아야 하므로 요청 size도 이 값을 쓴다 —
 * 조정 가능한 COMMENT_PAGE_SIZE를 넘기면 그 값을 바꾸는 순간 답글 일부가 조용히 사라진다.
 */
export const REPLY_PREVIEW_SIZE = 5

export const commentQueries = {
  all: () => ['comment'] as const,
  /** 답글 캐시 전체 — 원댓글 id로만 나뉘어 흔적(opinionId)으로는 걸러낼 수 없다 */
  repliesAll: () => [...commentQueries.all(), 'replies'] as const,
  listByOpinion: (opinionId: number) =>
    infiniteQueryOptions({
      queryKey: [...commentQueries.all(), 'by-opinion', opinionId],
      queryFn: ({ pageParam }) =>
        getComments(opinionId, { page: pageParam, size: COMMENT_PAGE_SIZE }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
  /**
   * 답글 더보기. 0페이지는 원댓글 응답의 `replies` 미리보기와 같은 구간이므로 1페이지부터 이어 받는다 —
   * 더보기를 한 번 누르면 미리보기 뒤로 REPLY_PREVIEW_SIZE개가 더 붙는다.
   * size가 미리보기 개수와 같아야 `page * size`(1페이지의 시작 지점)가 미리보기 끝과 정확히 맞물린다.
   */
  replies: (commentId: number) =>
    infiniteQueryOptions({
      queryKey: [...commentQueries.repliesAll(), commentId],
      queryFn: ({ pageParam }) =>
        getReplies(commentId, { page: pageParam, size: REPLY_PREVIEW_SIZE }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data?.pageInfo
        return pageInfo?.hasNext ? pageInfo.page + 1 : undefined
      },
    }),
}

export const commentMutations = {
  /** parentCommentId를 넘기면 답글, 없으면 원댓글로 생성된다(1-depth) */
  create: (opinionId: number) =>
    mutationOptions({
      mutationKey: [...commentQueries.all(), 'create'],
      mutationFn: ({ content, parentCommentId }: { content: string; parentCommentId?: number }) =>
        createComment(opinionId, { content, parentCommentId }),
    }),
  update: () =>
    mutationOptions({
      mutationKey: [...commentQueries.all(), 'update'],
      mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
        modifyComment(commentId, { content }),
    }),
  remove: () =>
    mutationOptions({
      mutationKey: [...commentQueries.all(), 'remove'],
      mutationFn: (commentId: number) => removeComment(commentId),
    }),
}
