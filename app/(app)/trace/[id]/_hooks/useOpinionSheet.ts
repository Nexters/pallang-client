'use client'

import { use, useEffect, useState } from 'react'

import { HardwareBackContext } from '@/app/_global/_data/hardwareBack.store'

import { createOpinionSheetModel, opinionSheetReducer } from '../_services/opinionSheet.service'
import type { OpinionSheetAction } from '../_types/opinionSheet.type'
import type { Trace } from '../_types/readerHighlights.type'

type UseOpinionSheetParams = {
  passageId: number | undefined
  /** 스포일러 대목이 가림막 해제 전이면 답글 시트도 열리지 않는다(#49) */
  isMasked: boolean
  /** 딥링크로 지목된 흔적 — 목록에 도착하는 대로 그 의견의 답글 시트가 올라온다 */
  selectedTrace: Trace | null
  /**
   * 답글 시트가 떠 있는지 셸에 알린다.
   * 셸이 든 남기기 FAB이 같은 자리를 다투므로 그때는 FAB이 물러난다.
   */
  onBottomBusyChange: (isBusy: boolean) => void
}

type OpinionSheetViewModel = {
  /** 답글 시트가 올라와 있는 의견 — null이면 닫힘 */
  replyOpinionId: number | null
  openReply: (opinionId: number) => void
  closeReply: () => void
}

/**
 * 의견 목록 위로 겹쳐 올라오는 답글 시트의 상태를 소유한다 —
 * 어느 의견의 답글을 보고 있는지, 딥링크가 지목한 흔적을 여는 것,
 * 답글 시트가 떠 있는 동안의 하드웨어 back까지.
 *
 * 전이 규칙은 opinionSheet.service의 순수 리듀서에 있고, 이 훅은 그 리듀서에
 * React의 수명(렌더 도중 상태 조정·효과·전환 타이머)만 붙인다.
 */
export function useOpinionSheet({
  passageId,
  isMasked,
  selectedTrace,
  onBottomBusyChange,
}: UseOpinionSheetParams): OpinionSheetViewModel {
  const [model, setModel] = useState(() => createOpinionSheetModel({ passageId, isMasked }))

  // 렌더 도중의 상태 조정 — React가 권하는 "prop이 바뀔 때 상태 조정하기" 패턴이다.
  // effect로 미루면 닫혀야 할 시트가 한 프레임 더 그려진다. 리듀서가 바뀔 것이 없으면
  // 받은 상태를 그대로 돌려주므로(sync가 항등) 이 분기는 스스로를 다시 부르지 않는다.
  // 딥링크가 지목한 흔적은 목록에 도착하는 대로 그 의견의 답글 시트로 연다 —
  // 상세 오버레이를 따로 두지 않고 답글 시트 하나로 모은다. 여는 조건(가림막·한 번만)은
  // 대목 전환·가림막 규칙과 한 자리에 있어야 해서 리듀서가 함께 판정한다.
  const synced = opinionSheetReducer(model, {
    type: 'sync',
    passageId,
    isMasked,
    deepLinkOpinionId: selectedTrace?.opinionId ?? null,
  })
  if (synced !== model) setModel(synced)

  // 이벤트 시점의 최신 상태 위에서 전이한다 — 렌더 도중 조정한 값과 어긋나지 않게 함수형으로 넘긴다
  const dispatch = (action: OpinionSheetAction) => {
    setModel((current) => opinionSheetReducer(current, action))
  }

  const replyOpinionId = synced.replyOpinionId
  const isReplyOpen = replyOpinionId !== null

  // 답글 시트가 떠 있는 동안만 하드웨어 back을 가져간다 — 항상 등록하면 닫힌 시트가 페이지의 back을
  // 삼킨다. 조건부 등록이라 useHardwareBack(무조건 등록) 대신 레지스트리를 직접 읽는다.
  // 레지스트리가 없는 곳(프로바이더 밖에서 목록만 렌더하는 경우)에서는 가로채지 않고 지나간다.
  const hardwareBack = use(HardwareBackContext)
  useEffect(() => {
    if (!isReplyOpen || !hardwareBack) return undefined
    return hardwareBack.register(() => {
      setModel((current) => opinionSheetReducer(current, { type: 'closeReply' }))
    })
  }, [isReplyOpen, hardwareBack])

  // 답글 시트는 FAB과 같은 자리를 덮는다 — 겹치지 않게 셸에 알린다.
  // 시안(229:24405·229:24447)에는 시트 위에도 FAB이 그려져 있지만 하단 입력바와 겹쳐, 숨기기로 정했다
  useEffect(() => {
    onBottomBusyChange(isReplyOpen)
  }, [isReplyOpen, onBottomBusyChange])

  return {
    replyOpinionId,
    openReply: (opinionId) => {
      dispatch({ type: 'openReply', opinionId })
    },
    closeReply: () => {
      dispatch({ type: 'closeReply' })
    },
  }
}
