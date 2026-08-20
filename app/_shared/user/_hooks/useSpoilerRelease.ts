'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { passageMutations, passageQueries } from '@/app/_global/_queries/passage.queries'
import { type MyPassage, userQueries } from '@/app/_global/_queries/user.queries'

/**
 * 스포일러 해제 한 흐름 — 확인 다이얼로그가 물고 있는 대상과 요청을 함께 들고 있는다.
 * 스포일러 관리와 책 상세 스포일러 탭이 같은 카드·같은 다이얼로그를 써서 두 화면이 이 훅을 공유한다.
 *
 * 성공했다는 안내는 따로 띄우지 않는다 — 해제한 카드가 목록에서 빠지는 것이 곧 결과다.
 * 실패는 화면에서 아무 일도 일어나지 않아 보이므로 문구로 알린다.
 */
export function useSpoilerRelease() {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<MyPassage | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * 응답이 늦게 와도 그 사이에 연 다른 대목의 다이얼로그를 닫지 않는다 —
   * 요청 중에 백드롭으로 빠져나간 뒤 다른 카드를 열면 먼저 보낸 응답이 도착하기 때문이다.
   */
  const closeIfStill = (passageId: number) => {
    setTarget((current) => (current?.passageId === passageId ? null : current))
  }

  const release = useMutation({
    ...passageMutations.updateSpoiler(),
    onSuccess: async (_data, { passageId }) => {
      closeIfStill(passageId)
      // 앞선 실패 안내가 떠 있으면 걷는다 — 성공한 해제가 실패로 읽히면 안 된다
      setErrorMessage('')
      // 해제한 대목은 관리 목록에서 빠지고, 흔적 보기의 블러도 함께 걷혀야 한다.
      // 그 책의 마지막 스포일러였으면 도서 필터에서도 빠져야 한다.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueries.spoilerPassageListAll() }),
        queryClient.invalidateQueries({ queryKey: passageQueries.all() }),
        queryClient.invalidateQueries({ queryKey: userQueries.filterBooks('SPOILER').queryKey }),
      ])
    },
    onError: (_error, { passageId }) => {
      closeIfStill(passageId)
      setErrorMessage('스포일러를 해제하지 못했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  const clearError = () => {
    setErrorMessage('')
  }

  return {
    target,
    isPending: release.isPending,
    errorMessage,
    /** `해제`를 눌러 확인 다이얼로그를 여는 자리 */
    start: (passage: MyPassage) => {
      clearError()
      setTarget(passage)
    },
    close: () => {
      setTarget(null)
      clearError()
    },
    clearError,
    confirm: () => {
      if (target) release.mutate({ passageId: target.passageId, isSpoiler: false })
    },
  }
}
