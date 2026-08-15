'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

import type { Trace } from '../../_types/readerHighlights.type'
import { OpinionReplyScreen } from '../OpinionReplyScreen/OpinionReplyScreen'
import { OpinionSheetList } from '../OpinionSheetList/OpinionSheetList'
import { OpinionSheetTitle } from '../OpinionSheetTitle/OpinionSheetTitle'

type TraceOpinionSheetProps = {
  open: boolean
  traces: Trace[]
  traceCount: number
  /** 답글 화면에 들어가 있는 의견 — null이면 의견 목록 화면이다 */
  selectedTrace: Trace | null
  canFetchMore: boolean
  onFetchMore: () => void
  onSelectOpinion: (opinionId: number) => void
  /** 답글 화면에서 의견 목록으로 되돌아간다 */
  onShowList: () => void
  onClose: () => void
}

/**
 * "N개의 의견"으로 진입하는 의견 목록 바텀시트(디자인 202:7290).
 * 의견 카드의 답글 버튼을 누르면 시트 안에서 답글 화면(디자인 202:7346)으로 겹쳐 전환된다.
 */
export function TraceOpinionSheet({
  open,
  traces,
  traceCount,
  selectedTrace,
  canFetchMore,
  onFetchMore,
  onSelectOpinion,
  onShowList,
  onClose,
}: TraceOpinionSheetProps) {
  const isReplyOpen = open && selectedTrace !== null
  // 답글 화면은 목록 위로 밀려 들어오는 오버레이 — 되돌아갈 때 슬라이드 아웃이 보이게 수명을 늘린다
  const reply = useExitTransition(isReplyOpen, MOTION_DURATION.normal)
  // 닫히는 동안에도 원본 의견과 답글이 남아 있어야 퇴장이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(selectedTrace)

  return (
    <BottomSheet
      open={open}
      tone="dark"
      title={
        <OpinionSheetTitle
          traceCount={traceCount}
          replyCount={shownTrace?.commentCount ?? 0}
          isReplyOpen={isReplyOpen}
        />
      }
      onBack={isReplyOpen ? onShowList : undefined}
      reserveBackSlot
      onClose={onClose}
      // 상단 54px(디자인 202:7346 — 상태바 44 + 10)만 남기고 화면을 채운다.
      // 고정 54px 대신 인셋 토큰을 쓴다 — 노치가 큰 기기에서 헤더가 노치에 가리지 않게.
      // pb-0: 하단 인셋은 안쪽에서 소비한다 — 패널이 먼저 먹으면 답글 화면의 검은 입력바
      // 아래로 시트 바닥이 띠로 남는다. 대신 목록과 입력바가 각자 pb-safe를 진다.
      popupClassName="h-[calc(100dvh-var(--safe-top)-10px)] pb-0"
      contentClassName="min-h-0 flex-1 gap-0 p-0"
    >
      {/* 시트 높이가 고정이라 목록↔답글 화면을 오가도 시트가 출렁이지 않는다 */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <OpinionSheetList
          traces={traces}
          isInert={isReplyOpen}
          canFetchMore={open && canFetchMore}
          onFetchMore={onFetchMore}
          onSelectOpinion={onSelectOpinion}
        />
        {reply.shouldRender && shownTrace && (
          <OpinionReplyScreen trace={shownTrace} state={reply.state} />
        )}
      </div>
    </BottomSheet>
  )
}
