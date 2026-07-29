import { mutationOptions, queryOptions } from '@tanstack/react-query'

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

export const commentQueries = {
  all: () => ['comment'] as const,
  listByOpinion: (opinionId: number) =>
    queryOptions({
      queryKey: [...commentQueries.all(), 'by-opinion', opinionId],
      // ponytail: size 100 고정 — 댓글이 100개를 넘으면 페이지네이션 필요
      queryFn: () => getComments(opinionId, { size: 100 }),
    }),
  replies: (commentId: number) =>
    queryOptions({
      queryKey: [...commentQueries.all(), 'replies', commentId],
      // ponytail: size 100 고정 — 답글이 100개를 넘으면 페이지네이션 필요
      queryFn: () => getReplies(commentId, { size: 100 }),
    }),
}

export const commentMutations = {
  /** 원댓글 작성 — 답글 작성(parentCommentId)은 필요해질 때 확장한다 */
  create: (opinionId: number) =>
    mutationOptions({
      mutationKey: [...commentQueries.all(), 'create'],
      mutationFn: (content: string) => createComment(opinionId, { content }),
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
