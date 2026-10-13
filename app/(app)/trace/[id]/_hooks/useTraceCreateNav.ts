'use client'

import { useRouter } from 'next/navigation'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { buildTraceSeedHref } from '@/app/_shared/trace/_data/traceSeed.model'

type TraceCreateNavInput = {
  bookId: number
  bookTitle: string
  bookCoverImageUrl: string | null
  /** 모임 안에서 연 화면이면 그 모임 — 여기서 남기는 흔적도 같은 모임에 붙는다 */
  groupId?: number
}

/**
 * 기록(새 대목)은 대목 입력·꾸미기 단계를 거쳐야 해서 이 화면에서 바로 등록할 수 없다.
 * 작성 플로우로 보내되, 초안은 그 route 안에서만 사는 Context라 씨앗을 URL로 넘긴다.
 * 의견은 여기로 오지 않는다 — 보고 있는 대목에 그 자리에서 등록한다(OpinionComposer, #368).
 */
export function useTraceCreateNav({
  bookId,
  bookTitle,
  bookCoverImageUrl,
  groupId,
}: TraceCreateNavInput) {
  const router = useRouter()
  const runWithLogin = useLoginGate()

  return {
    /** '기록' — 이 책에 새 대목을 남기는 자리라 보고 있는 대목을 물지 않는다 */
    addRecord: () => {
      runWithLogin(() => {
        router.push(
          buildTraceSeedHref({
            bookId,
            bookTitle,
            bookCoverImageUrl,
            passage: null,
            groupId: groupId ?? null,
          }),
        )
      }, LOGIN_GATE_MESSAGE.traceCreate)
    },
  }
}
