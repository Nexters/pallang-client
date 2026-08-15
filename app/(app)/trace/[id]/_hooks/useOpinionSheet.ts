'use client'

import { use, useEffect, useRef, useState } from 'react'

import { HardwareBackContext } from '@/app/_global/_data/hardwareBack.store'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { type ExitTransitionState, useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

import { createOpinionSheetModel, opinionSheetReducer } from '../_services/opinionSheet.service'
import type { OpinionSheetAction } from '../_types/opinionSheet.type'
import type { Trace } from '../_types/readerHighlights.type'

type UseOpinionSheetParams = {
  passageId: number | undefined
  /** 스포일러 대목이 가림막 해제 전이면 시트도 댓글도 열리지 않는다(#49) */
  isMasked: boolean
  /** 딥링크로 지목된 흔적 — 상세 오버레이가 이 값을 따라 뜬다 */
  selectedTrace: Trace | null
  /**
   * 화면 하단을 차지하는 것(상세 오버레이·댓글 입력바)이 떠 있는지 셸에 알린다.
   * 셸이 든 남기기 FAB이 같은 자리를 다투므로 그때는 FAB이 물러난다.
   */
  onDetailOpenChange: (isOpen: boolean) => void
}

type OpinionSheetViewModel = {
  /** 의견 바텀시트가 떠 있는지 */
  isOpen: boolean
  /** 답글 화면에 들어가 있는 의견 — null이면 의견 목록 화면이다 */
  selectedOpinionId: number | null
  /** 흔적 목록에서 댓글이 펼쳐진 의견 — null이면 모두 접혀 있다 */
  expandedOpinionId: number | null
  /** 상세 오버레이 — 닫혀 있으면 null. 퇴장 전환 중에도 열린 것으로 본다 */
  detail: { trace: Trace; state: ExitTransitionState } | null
  openSheet: () => void
  selectOpinion: (opinionId: number) => void
  showList: () => void
  close: () => void
  toggleComments: (opinionId: number) => void
}

/**
 * 의견 시트 흐름의 상태를 전부 소유한다 — 시트 화면, 목록에서 펼친 댓글,
 * 상세 오버레이의 등장/퇴장, 시트가 떠 있는 동안의 하드웨어 back까지.
 *
 * 전이 규칙은 opinionSheet.service의 순수 리듀서에 있고, 이 훅은 그 리듀서에
 * React의 수명(렌더 도중 상태 조정·효과·전환 타이머)만 붙인다.
 */
export function useOpinionSheet({
  passageId,
  isMasked,
  selectedTrace,
  onDetailOpenChange,
}: UseOpinionSheetParams): OpinionSheetViewModel {
  const [model, setModel] = useState(() => createOpinionSheetModel({ passageId, isMasked }))

  // 렌더 도중의 상태 조정 — React가 권하는 "prop이 바뀔 때 상태 조정하기" 패턴이다.
  // effect로 미루면 닫혀야 할 시트가 한 프레임 더 그려진다. 리듀서가 바뀔 것이 없으면
  // 받은 상태를 그대로 돌려주므로(sync가 항등) 이 분기는 스스로를 다시 부르지 않는다.
  const synced = opinionSheetReducer(model, { type: 'sync', passageId, isMasked })
  if (synced !== model) setModel(synced)

  // 이벤트 시점의 최신 상태 위에서 전이한다 — 렌더 도중 조정한 값과 어긋나지 않게 함수형으로 넘긴다
  const dispatch = (action: OpinionSheetAction) => {
    setModel((current) => opinionSheetReducer(current, action))
  }

  const isOpen = synced.sheet !== null
  const selectedOpinionId = synced.sheet?.opinionId ?? null

  const handleBack = () => {
    // 답글 화면에서는 의견 목록으로 한 칸만 되돌아간다 — 시트째 닫으면 돌아갈 길이 사라진다
    if (selectedOpinionId !== null) dispatch({ type: 'showList' })
    else dispatch({ type: 'closeSheet' })
  }

  // 시트가 떠 있는 동안만 하드웨어 back을 가져간다 — 항상 등록하면 닫힌 시트가 페이지의 back을
  // 삼킨다. 조건부 등록이라 useHardwareBack(무조건 등록) 대신 레지스트리를 직접 읽는다.
  // 레지스트리가 없는 곳(프로바이더 밖에서 목록만 렌더하는 경우)에서는 가로채지 않고 지나간다 —
  // back이 필요한 건 시트가 떠 있는 동안뿐이라 페이지 전체가 프로바이더를 요구하게 두지 않는다.
  const hardwareBack = use(HardwareBackContext)
  const handleBackRef = useRef(handleBack)
  useEffect(() => {
    handleBackRef.current = handleBack
  })
  useEffect(() => {
    if (!isOpen || !hardwareBack) return undefined
    return hardwareBack.register(() => {
      handleBackRef.current()
    })
  }, [isOpen, hardwareBack])

  // 닫히는 동안에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(selectedTrace)
  // 가림막이 씌워져 있으면 상세도 열리지 않는다 — 상세로 가는 길은 딥링크뿐이라
  // 목록에서 막을 자리가 없고, 여기서만 조건을 건다(#49)
  const detailTransition = useExitTransition(
    selectedTrace !== null && !isMasked,
    MOTION_DURATION.slow,
  )
  // 퇴장 전환 중에도 오버레이는 aria-modal인 채로 화면에 남아 있어, 언마운트될 때까지 열린 것으로 본다
  const detail =
    detailTransition.shouldRender && shownTrace !== null
      ? { trace: shownTrace, state: detailTransition.state }
      : null

  // 입력바도 FAB과 같은 자리에 뜬다 — 둘이 겹치지 않게 셸에 함께 알린다
  const isBottomBusy = detail !== null || synced.expandedOpinionId !== null
  useEffect(() => {
    onDetailOpenChange(isBottomBusy)
  }, [isBottomBusy, onDetailOpenChange])

  return {
    isOpen,
    selectedOpinionId,
    expandedOpinionId: synced.expandedOpinionId,
    detail,
    openSheet: () => {
      dispatch({ type: 'openSheet' })
    },
    selectOpinion: (opinionId) => {
      dispatch({ type: 'selectOpinion', opinionId })
    },
    showList: () => {
      dispatch({ type: 'showList' })
    },
    close: () => {
      dispatch({ type: 'closeSheet' })
    },
    toggleComments: (opinionId) => {
      dispatch({ type: 'toggleComments', opinionId })
    },
  }
}
