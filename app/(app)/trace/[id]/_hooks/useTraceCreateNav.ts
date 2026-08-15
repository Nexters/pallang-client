'use client'

import { useRouter } from 'next/navigation'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import {
  buildTraceSeedHref,
  type TraceSeedPassage,
} from '@/app/_shared/trace/_data/traceSeed.model'

/** 대목에서 씨앗으로 실어 보낼 부분 — 쪽 번호만 대목이 아니라 보고 있는 무대에서 온다 */
type ActivePassage = Omit<TraceSeedPassage, 'pageNumber'>

type TraceCreateNavInput = {
  bookId: number
  bookTitle: string
  bookCoverImageUrl: string | null
  /** 보고 있는 대목 — 아직 도착하지 않았으면 undefined다 */
  activePassage: ActivePassage | undefined
  /** 보고 있는 쪽 */
  pageNumber: number
}

/**
 * 흔적 작성은 여러 단계를 거쳐야 해서 이 화면에서 바로 등록할 수 없다.
 * 작성 플로우로 보내되, 초안은 그 route 안에서만 사는 Context라 씨앗을 URL로 넘긴다.
 * passage를 함께 넘기면 그 대목에 붙고(병합), 넘기지 않으면 새 대목을 만든다.
 */
export function useTraceCreateNav({
  bookId,
  bookTitle,
  bookCoverImageUrl,
  activePassage,
  pageNumber,
}: TraceCreateNavInput) {
  const router = useRouter()
  const runWithLogin = useLoginGate()

  const goCreateTrace = (passage: TraceSeedPassage | null) => {
    runWithLogin(() => {
      router.push(buildTraceSeedHref({ bookId, bookTitle, bookCoverImageUrl, passage }))
    }, LOGIN_GATE_MESSAGE.traceCreate)
  }

  return {
    /**
     * '의견 남기기' — 보고 있는 대목에 의견 하나를 더한다.
     * 대목의 꾸밈까지 실어 보내 작성 플로우가 꾸미기를 건너뛰고 의견 작성부터 열게 한다.
     * 합칠 대목도 이 대목으로 정해져 있어 합치기를 따로 묻지 않는다.
     */
    addOpinion: () => {
      if (!activePassage) return
      goCreateTrace({
        passageId: activePassage.passageId,
        pageNumber,
        quotedText: activePassage.quotedText,
        isSpoiler: activePassage.isSpoiler,
        decorations: activePassage.decorations,
      })
    },
    /** '기록' — 이 책에 새 대목을 남기는 자리라 보고 있는 대목을 물지 않는다 */
    addRecord: () => {
      goCreateTrace(null)
    },
  }
}
