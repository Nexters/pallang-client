'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { bookQueries } from '@/app/_global/_queries/book.queries'
import { opinionMutations, opinionQueries } from '@/app/_global/_queries/opinion.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import type { TraceSeedPassage } from '@/app/_shared/trace/_data/traceSeed.model'

type OpinionSubmitInput = {
  bookId: number
  /** 의견이 붙을 대목 — 무대가 지금 보여주는 그 대목이다. 아직 도착 전이면 undefined */
  activePassage: Omit<TraceSeedPassage, 'pageNumber'> | undefined
  /** 보고 있는 쪽 — 대목이 아니라 무대에서 온다(useTraceCreateNav와 같은 구분) */
  pageNumber: number
  /** 모임 안에서 연 화면이면 그 모임 — 여기서 남기는 의견도 같은 모임에 붙는다 */
  groupId?: number
}

/**
 * 보고 있는 대목에 의견 하나를 그 자리에서 등록한다(#368) — 작성 플로우(/trace/new)로
 * 라우팅하던 길을 대신한다. 대목 원문·꾸밈을 그대로 실어 passageId로 병합 생성하므로
 * 씨앗을 물고 가던 것과 서버가 받는 내용이 같다.
 *
 * 등록과 목록 갱신까지 끝났을 때만 true를 돌려준다 — 입력바(CommentBar)는 이 값 하나로
 * 입력을 비울지 남길지 정한다(useCommentSubmit과 같은 계약). 실패면 입력을 그대로 남긴다.
 */
export function useOpinionSubmit({
  bookId,
  activePassage,
  pageNumber,
  groupId,
}: OpinionSubmitInput) {
  const queryClient = useQueryClient()
  const create = useMutation(opinionMutations.create())

  return (content: string) =>
    new Promise<boolean>((resolve) => {
      if (!activePassage) {
        resolve(false)
        return
      }
      create.mutate(
        {
          bookId,
          pageNumber,
          quotedText: activePassage.quotedText,
          isSpoiler: activePassage.isSpoiler,
          passageId: activePassage.passageId,
          content,
          decorations: activePassage.decorations.map((decoration) => ({
            startOffset: decoration.startOffset,
            endOffset: decoration.endOffset,
            effectType: decoration.effectType,
            color: decoration.color,
          })),
          // 전역 흔적은 자리째 빼고 보낸다 — 서버가 이 자리의 유무로 스코프를 가른다(useTraceSubmit과 동일)
          ...(groupId === undefined ? {} : { groupId }),
        },
        {
          // 새 의견이 목록과 "N개의 의견"에 보이고 나서 입력창이 비워진다.
          // 개수도 의견 목록 응답에서 오므로 목록 키 하나로 함께 갱신된다
          onSuccess: () => {
            // 내 흔적·스포일러 관리, 서재 목록·책 상세도 이 흔적을 세어야 한다 — 기다리지 않고
            // stale로만 돌린다(refetchType 기본값 'active'라 마운트된 화면만 다시 받는다)
            void queryClient.invalidateQueries({ queryKey: userQueries.all() })
            void queryClient.invalidateQueries({ queryKey: bookQueries.all() })
            void queryClient.invalidateQueries({ queryKey: opinionQueries.listAll() }).then(() => {
              resolve(true)
            })
          },
          onError: () => {
            resolve(false)
          },
        },
      )
    })
}
