import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { OpinionLikeState } from '@/app/_global/_queries/opinion.queries'
import { opinionMutations, opinionQueries } from '@/app/_global/_queries/opinion.queries'

/**
 * 흔적 좋아요 토글. 목록 아이템과 상세 오버레이가 같은 캐시 키를 읽어 한쪽에서 누르면 다른 쪽도 함께 바뀐다.
 * 연타해도 UI가 튀지 않도록 먼저 캐시를 낙관적으로 바꾸고, 성공하면 서버 응답으로, 실패하면 이전 값으로 되돌린다.
 */
export function useOpinionLike(opinionId: number, serverLikeCount: number) {
  const queryClient = useQueryClient()
  const { queryKey } = opinionQueries.likeState(opinionId)
  const { data } = useQuery(opinionQueries.likeState(opinionId))
  // 아직 눌러본 적 없는 흔적은 서버 목록의 좋아요 수를 기준으로 그린다
  const state: OpinionLikeState = data ?? { liked: false, likeCount: serverLikeCount }

  const toggle = useMutation({
    ...opinionMutations.toggleLike(opinionId),
    onMutate: () => {
      // 연타 시 직전 클릭의 결과 위에 쌓이도록 렌더 값이 아니라 캐시를 다시 읽는다
      const previous = queryClient.getQueryData<OpinionLikeState>(queryKey) ?? {
        liked: false,
        likeCount: serverLikeCount,
      }
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
