import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { OpinionLikeState } from '@/app/_global/_queries/opinion.queries'
import { opinionMutations, opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

/**
 * 흔적 좋아요 토글. 목록 아이템과 상세 오버레이가 같은 캐시 키를 읽어 한쪽에서 누르면 다른 쪽도 함께 바뀐다.
 * 연타해도 UI가 튀지 않도록 먼저 캐시를 낙관적으로 바꾸고, 성공하면 서버 응답으로, 실패하면 이전 값으로 되돌린다.
 *
 * 이 화면에서 눌러본 적이 없으면 목록 응답이 준 값(serverState)이 기준이다 —
 * `liked`를 false로 깔면 이미 좋아요한 흔적이 꺼진 채로 그려지고, 그걸 누른 사용자는
 * 켜려다 좋아요를 취소하게 된다.
 */
export function useOpinionLike(opinionId: number, serverState: OpinionLikeState) {
  const queryClient = useQueryClient()
  const { queryKey } = opinionQueries.likeState(opinionId)
  const { data } = useQuery(opinionQueries.likeState(opinionId))
  const state: OpinionLikeState = data ?? serverState

  const toggle = useMutation({
    ...opinionMutations.toggleLike(opinionId),
    onMutate: () => {
      // 연타 시 직전 클릭의 결과 위에 쌓이도록 렌더 값이 아니라 캐시를 다시 읽는다
      const previous = queryClient.getQueryData<OpinionLikeState>(queryKey) ?? serverState
      queryClient.setQueryData<OpinionLikeState>(queryKey, {
        liked: !previous.liked,
        likeCount: Math.max(previous.likeCount + (previous.liked ? -1 : 1), 0),
      })
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData<OpinionLikeState>(queryKey, context.previous)
    },
    onSuccess: (response) => {
      const result = response.data
      if (!result) return
      queryClient.setQueryData<OpinionLikeState>(queryKey, {
        liked: result.liked,
        likeCount: result.likeCount,
      })
      // 좋아요 관리 목록·도서 필터는 따로 캐시된다 — 돌아갔을 때 빈 목록이 남지 않게 stale로 돌린다
      void queryClient.invalidateQueries({ queryKey: userQueries.likedOpinionListAll() })
      void queryClient.invalidateQueries({ queryKey: userQueries.filterBooks('LIKE').queryKey })
    },
  })

  return {
    isLiked: state.liked,
    likeCount: state.likeCount,
    toggle: () => {
      toggle.mutate()
    },
  }
}
