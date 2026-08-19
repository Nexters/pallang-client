'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { opinionMutations } from '@/app/_global/_queries/opinion.queries'

import { useTraceDraft } from './useTraceDraft'
import { useTraceNav } from './useTraceNav'

/**
 * 초안 하나를 흔적으로 저장한다. 저장이 두 화면에 있어(③ 책 등록하기, 그리고 흔적 보기에서
 * 대목을 물고 들어온 경우의 ① 생각 작성) 화면마다 베끼면 한쪽에서만 조용히 빠지는 분기가 생긴다
 * — 로그인 게이트·합칠 대목 소실 처리가 그렇다. 그래서 한곳에 모은다.
 *
 * 어떤 실패에서도 초안을 버리지 않는다. 이 시점의 유실 비용이 플로우 전체에서 가장 크다.
 */
export function useTraceSubmit() {
  const { draft, dispatch } = useTraceDraft()
  const { goTo } = useTraceNav()
  const createOpinion = useMutation(opinionMutations.create())
  const runWithLogin = useLoginGate()
  const [message, setMessage] = useState('')

  const save = () => {
    if (!draft.book) return
    // 페이지 상한은 ①에서 볼 수 없다 — 책을 ③에서 고르기 때문이다. 그래서 쪽수를 아는
    // 시점에 막는다. 그냥 보내면 서버가 거절하고 "잠시 후 다시 시도" 안내가 뜨는데,
    // 다시 눌러도 계속 실패하고 무엇을 고쳐야 하는지도 알 수 없다.
    // 쪽수를 끝내 모르는 책도 있다(인기 목록 책, 내부 검색에서 못 찾은 씨앗 책) — 그때는
    // 검사를 건너뛴다. 씨앗 책의 쪽수는 useBookDetailFill이 미리 채워 준다.
    const maxPage = draft.book.pageCount
    if (draft.pageNumber !== null && maxPage !== null && draft.pageNumber > maxPage) {
      setMessage('페이지 번호가 이 책의 쪽수를 넘어요. 뒤로 가서 페이지를 확인해주세요.')
      return
    }
    createOpinion.mutate(
      {
        bookId: draft.book.bookId,
        pageNumber: draft.pageNumber ?? undefined,
        quotedText: draft.quotedText,
        isSpoiler: draft.isSpoiler,
        passageId: draft.passageId,
        content: draft.content,
        decorations: draft.decorations.map((decoration) => ({
          startOffset: decoration.startOffset,
          endOffset: decoration.endOffset,
          effectType: decoration.effectType,
          color: decoration.color,
        })),
        // 모임 안에서 남기는 흔적이면 그 모임에 붙인다. 전역 흔적은 자리째 빼고 보낸다 —
        // 서버가 이 자리의 유무로 스코프를 가른다.
        ...(draft.groupId === null ? {} : { groupId: draft.groupId }),
      },
      {
        onSuccess: (response) => {
          if (!response.data) {
            setMessage('흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
            return
          }
          dispatch({
            type: 'setResult',
            result: {
              opinionId: response.data.opinionId,
              // 완료 화면이 방금 남긴 흔적으로 곧장 보내려면 대목까지 알아야 한다
              passageId: response.data.passageId,
              merged: response.data.merged,
            },
          })
          goTo('done')
        },
        onError: (error) => {
          // draft는 그대로 둔다. 여기서 날리면 사용자가 입력한 전부가 사라진다.
          // 저장은 로그인이 필요하다. 일반 문구로 뭉개면 다시 눌러도 계속 실패한다.
          if (error instanceof ApiError && error.status === 401) {
            runWithLogin(() => {
              // 로그인 상태인데도 401이면 토큰이 만료된 것이다. 다시 시도하도록 알린다.
              setMessage('로그인 정보가 만료됐어요. 다시 시도해주세요.')
            }, LOGIN_GATE_MESSAGE.traceCreate)
            return
          }
          if (
            error instanceof ApiError &&
            (error.code === 'PASSAGE_400_2' || error.code === 'PASSAGE_404_1')
          ) {
            dispatch({ type: 'setMergeTarget', passageId: null })
            setMessage('합치려던 대목이 사라졌어요. 다시 시도해주세요.')
            return
          }
          setMessage('흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
        },
      },
    )
  }

  return {
    closeMessage: () => {
      setMessage('')
    },
    isSaving: createOpinion.isPending,
    message,
    save,
  }
}
