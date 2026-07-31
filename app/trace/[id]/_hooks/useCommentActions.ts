import { useMutation, useQueryClient } from '@tanstack/react-query'

import { commentMutations, commentQueries } from '@/app/_global/_queries/comment.queries'

/**
 * 댓글 작성·수정·삭제 후 댓글 목록/답글 쿼리를 함께 갱신하는 mutation 묶음.
 *
 * 무효화는 이 흔적(opinionId)의 목록과 지금 화면에 붙어 있는 답글 묶음까지만 건드린다.
 * ['comment'] 전체를 무효화하면 다른 흔적의 댓글 캐시까지 낡은 것으로 표시돼, 그 흔적을 다시 열 때
 * 필요 없는 재조회가 따라온다.
 *
 * ponytail: 서버가 원댓글 목록을 어떤 순서로 주는지(최신순/오래된순) 확인되지 않았다. 오래된 순이라면
 * 새로 쓴 댓글은 아직 불러오지 않은 마지막 페이지에 놓여, 무효화해도 화면에 나타나지 않는다.
 * _tests/traceComments.spec.tsx의 생성 스텁이 새 댓글을 앞에 붙이는(최신순) 가정이라 이 경우를 잡지 못한다 —
 * 백엔드에 정렬을 확인한 뒤 정렬 파라미터를 명시하거나, 등록 후 첫 페이지로 되돌리는 처리를 넣을 것.
 */
export function useCommentActions(opinionId: number) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: commentQueries.listByOpinion(opinionId).queryKey,
      }),
      // 답글 캐시는 원댓글 id로만 나뉘어 흔적으로 걸러낼 수 없다. 댓글은 아코디언이라 화면에 붙어 있는
      // 답글 묶음은 지금 펼친 흔적의 것뿐이므로, 관찰자가 있는 답글 쿼리만 갱신한다.
      queryClient.invalidateQueries({
        queryKey: commentQueries.repliesAll(),
        predicate: (query) => query.getObserversCount() > 0,
      }),
    ])

  const create = useMutation({ ...commentMutations.create(opinionId), onSuccess: invalidate })
  const update = useMutation({ ...commentMutations.update(), onSuccess: invalidate })
  const remove = useMutation({ ...commentMutations.remove(), onSuccess: invalidate })

  return { create, update, remove }
}
