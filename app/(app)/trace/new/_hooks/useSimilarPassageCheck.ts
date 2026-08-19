'use client'

import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { shouldCheckSimilar, similarCheckKey } from '../_services/similarCheck.service'
import { useTraceDraft } from './useTraceDraft'

export type MergeCandidate = { passageId: number; quotedText: string }

/**
 * 지금 쓰고 있는 대목이 이 책에 이미 있는지 서버에 묻고, 후보가 있으면 합칠지 물을 거리를 돌려준다.
 *
 * 묻는 자리가 화면 하나로 정해지지 않아 훅으로 둔다 — 책을 물고 들어온 경로는 ①에서,
 * 책을 마지막에 고르는 경로는 ③에서 처음으로 '책 + 대목'이 갖춰진다. 두 번 묻지 않게 하는
 * 표시는 초안(`similarCheckedKey`)에 남으므로 화면이 갈려도 이어진다.
 *
 * @param enabled 지금 서 있는 단계에서만 켠다. Next가 지나온 단계를 언마운트하지 않고
 *   감춰 두기 때문에(Cache Components), 이걸 끄지 않으면 감춰진 ①과 서 있는 ③이 동시에 묻는다.
 */
export function useSimilarPassageCheck(enabled: boolean) {
  const { draft, dispatch } = useTraceDraft()
  const [candidate, setCandidate] = useState<MergeCandidate | null>(null)
  const { mutate: checkSimilar } = useMutation(passageMutations.similarCheck())

  const key = similarCheckKey(draft)
  const shouldAsk = enabled && shouldCheckSimilar(draft)
  const { book, pageNumber, quotedText } = draft
  // 초안의 표시는 응답이 돌아온 뒤에야 찍힌다 — 그사이 다시 렌더돼도 또 보내지 않게 붙잡아 둔다
  const requestedKeyRef = useRef<null | string>(null)

  useEffect(() => {
    if (!shouldAsk || key === null || !book) return
    if (requestedKeyRef.current === key) return
    requestedKeyRef.current = key

    checkSimilar(
      {
        bookId: book.bookId,
        quotedText,
        // 페이지를 모를 때는 아예 빼고 보낸다. 서버는 인접 페이지(±1)에서 후보를 찾으므로
        // 0을 대신 넣으면 -1~1쪽만 뒤지게 되어 어떤 후보도 걸리지 않는다.
        ...(pageNumber === null ? {} : { pageNumber }),
      },
      {
        onSuccess: (response) => {
          const first = response.data?.passages[0]
          if (first) setCandidate({ passageId: first.passageId, quotedText: first.quotedText })
        },
        // 유사 검사는 편의 기능이다. 실패해도 등록을 막지 않는다.
        onError: () => {
          setCandidate(null)
        },
        // 성공이든 실패든 이 조합은 물어본 것으로 친다 — 실패해도 재시도 루프가 생기지 않는다
        onSettled: () => {
          dispatch({ type: 'markSimilarChecked', key })
        },
      },
    )
  }, [book, checkSimilar, dispatch, key, pageNumber, quotedText, shouldAsk])

  return {
    candidate,
    /** 따로 남긴다 — 합칠 대목을 비우고 물음을 닫는다. */
    dismiss: () => {
      dispatch({ type: 'setMergeTarget', passageId: null })
      setCandidate(null)
    },
    /** 합친다 — 후보 대목을 합칠 곳으로 삼는다. */
    merge: () => {
      if (candidate) dispatch({ type: 'setMergeTarget', passageId: candidate.passageId })
      setCandidate(null)
    },
  }
}
