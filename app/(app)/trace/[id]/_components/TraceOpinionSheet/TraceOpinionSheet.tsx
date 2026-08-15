'use client'

import { useRef } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useHardwareBack } from '@/app/_global/_hooks/useHardwareBack'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { cn } from '@/app/_global/_services/cn.service'

import type { Trace } from '../../_types/readerHighlights.type'
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'

type TraceOpinionSheetProps = {
  open: boolean
  traces: Trace[]
  traceCount: number
  /** 답글 화면에 들어가 있는 의견 — null이면 의견 목록 화면이다 */
  selectedOpinionId: number | null
  canFetchMore: boolean
  onFetchMore: () => void
  onSelectOpinion: (opinionId: number) => void
  /** 답글 화면에서 의견 목록으로 되돌아간다 */
  onShowList: () => void
  onClose: () => void
}

/** 시트가 떠 있는 동안만 하드웨어 back을 가져간다 — 항상 등록하면 닫힌 시트가 페이지의 back을 삼킨다 */
function SheetHardwareBack({ onBack }: { onBack: () => void }) {
  useHardwareBack(onBack)
  return null
}

/**
 * "N개의 의견"으로 진입하는 의견 목록 바텀시트(디자인 202:7290).
 * 의견 카드의 답글 버튼을 누르면 시트 안에서 답글 화면(디자인 202:7346)으로 겹쳐 전환된다.
 */
export function TraceOpinionSheet({
  open,
  traces,
  traceCount,
  selectedOpinionId,
  canFetchMore,
  onFetchMore,
  onSelectOpinion,
  onShowList,
  onClose,
}: TraceOpinionSheetProps) {
  const listScrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const selectedTrace = traces.find((trace) => trace.opinionId === selectedOpinionId) ?? null
  const isReplyOpen = open && selectedTrace !== null
  // 답글 화면은 목록 위로 밀려 들어오는 오버레이 — 되돌아갈 때 슬라이드 아웃이 보이게 수명을 늘린다
  const reply = useExitTransition(isReplyOpen, MOTION_DURATION.normal)
  // 닫히는 동안에도 원본 의견과 답글이 남아 있어야 퇴장이 빈 화면으로 보이지 않는다
  const shownTrace = useLastPresent(selectedTrace)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: listScrollRef,
    enabled: open && canFetchMore,
    onLoadMore: onFetchMore,
  })

  return (
    <>
      {open && (
        <SheetHardwareBack
          onBack={() => {
            if (selectedOpinionId !== null) onShowList()
            else onClose()
          }}
        />
      )}
      <BottomSheet
        open={open}
        tone="dark"
        // 두 제목을 겹쳐 두고 크로스페이드한다 — 즉시 스왑하면 본문 슬라이드(240ms)와 시점이
        // 어긋나 헤더만 먼저 바뀐 것으로 보인다. 비활성 레이어는 aria-hidden으로 빼서
        // 다이얼로그의 접근성 이름에는 보이는 제목 하나만 남는다.
        title={
          <span className="relative block">
            <span
              aria-hidden={isReplyOpen || undefined}
              className={cn(
                'block transition-opacity duration-fast ease-standard',
                isReplyOpen && 'opacity-0',
              )}
            >
              의견 ({traceCount})
            </span>
            <span
              aria-hidden={!isReplyOpen || undefined}
              className={cn(
                'absolute inset-0 transition-opacity duration-fast ease-standard',
                !isReplyOpen && 'opacity-0',
              )}
            >
              답글 ({shownTrace?.commentCount ?? 0})
            </span>
          </span>
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
          {/* 답글 화면이 덮고 있는 동안 뒤의 목록은 포커스·보조기기에서 뺀다 */}
          <div
            ref={listScrollRef}
            inert={isReplyOpen}
            className="h-full overflow-y-auto px-4 pb-safe"
          >
            <ul className="flex flex-col">
              {traces.map((trace, index) => (
                <li
                  key={trace.opinionId}
                  // 구분선 양옆 24px — 흔적 목록과 같은 리듬이다(디자인 202:7290 Content gap)
                  className={
                    index > 0 ? 'mt-6 border-t border-dashed border-white/30 pt-6' : undefined
                  }
                >
                  <TraceItem
                    trace={trace}
                    onSelect={() => {
                      onSelectOpinion(trace.opinionId)
                    }}
                    onOpenComments={() => {
                      onSelectOpinion(trace.opinionId)
                    }}
                  />
                </li>
              ))}
            </ul>
            {/* 목록 끝 sentinel — 시트 스크롤이 끝에 닿으면 다음 의견 페이지를 불러온다 */}
            <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
          </div>
          {reply.shouldRender && shownTrace && (
            <div
              data-state={reply.state}
              aria-label="답글 상세"
              className={cn(
                'absolute inset-0 z-1 flex flex-col bg-bg-dark',
                'transition-transform duration-normal ease-enter',
                'data-[state=entering]:translate-x-full data-[state=exiting]:translate-x-full',
                'data-[state=exiting]:ease-exit',
                // 슬라이드 아웃 동안 클릭이 죽은 화면에 먹히지 않게 흘려보낸다
                'data-[state=exiting]:pointer-events-none',
              )}
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <TraceItem trace={shownTrace} isContentClamped={false} />
                <TraceCommentSection opinionId={shownTrace.opinionId} />
              </div>
              <TraceCommentComposer opinionId={shownTrace.opinionId} variant="sheet" />
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
