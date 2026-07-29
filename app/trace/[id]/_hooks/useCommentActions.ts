import { useMutation, useQueryClient } from '@tanstack/react-query'

import { commentMutations, commentQueries } from '@/app/_global/_queries/comment.queries'

/** 댓글 작성·수정·삭제 후 댓글 목록/답글 쿼리를 함께 갱신하는 mutation 묶음 */
export function useCommentActions(opinionId: number) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: commentQueries.all() })

  const create = useMutation({ ...commentMutations.create(opinionId), onSuccess: invalidate })
  const update = useMutation({ ...commentMutations.update(), onSuccess: invalidate })
  const remove = useMutation({ ...commentMutations.remove(), onSuccess: invalidate })

  return { create, update, remove }
}
