'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

import { px, SHEET_TOP_EXPANDED } from '../../_data/quoteStage.constant'
import { useTraceComments } from '../../_hooks/useTraceComments'
import type { Trace } from '../../_types/readerHighlights.type'
import { ReplyThreadSection } from '../ReplyThreadSection/ReplyThreadSection'
import { TraceCommentComposer } from '../TraceCommentComposer/TraceCommentComposer'
import { TraceCommentSection } from '../TraceCommentSection/TraceCommentSection'
import { TraceItem } from '../TraceItem/TraceItem'
import { TraceReplyComposer } from '../TraceReplyComposer/TraceReplyComposer'

type TraceCommentSheetProps = {
  /** 댓글을 보고 있는 의견 — null이면 시트가 내려가 있다 */
  trace: Trace | null
  onClose: () => void
}

/**
 * 흔적의 댓글 아이콘으로 올라오는 댓글 시트(디자인 주석 229:18243).
 *
 * 의견 목록 시트 위로 한 겹 더 올라와 그것을 통째로 덮는다 — 목록을 옆으로 밀어내는 대신
 * 시트를 겹치면 내려서 닫는 길이 그대로 남고, 뒤의 목록도 자리를 지킨다.
 *
 * 이 화면의 위계는 의견 → 댓글 → 답글 3단계다. 답글은 시트를 한 겹 더 올리지 않고
 * **이 시트의 본문·헤더를 답글 뷰로 갈아끼운다**(#373, 시안 3393-49475) — 도서 등록 폼이
 * 책 검색 시트의 본문을 갈아끼우는 것(BookSearchSheet)과 같은 문법이다. 그래서 헤더의
 * ←·X·바깥 탭·하드웨어 뒤로가기는 모두 같은 규칙을 따른다: 답글 뷰가 열려 있으면 그것만
 * 접어 댓글 뷰로 돌아오고, 아니면 시트 전체를 닫는다.
 */
export function TraceCommentSheet({ trace, onClose }: TraceCommentSheetProps) {
  // 내려가는 동안에도 원본 의견과 댓글이 남아 있어야 퇴장이 빈 시트로 보이지 않는다
  const shownTrace = useLastPresent(trace)
  const commentsState = useTraceComments(shownTrace?.opinionId ?? 0, {
    enabled: shownTrace !== null,
  })
  // 답글 뷰가 보고 있는 원댓글 — id로 들고 최신 객체는 목록에서 찾는다. 객체 스냅샷을 들면
  // 답글을 단 뒤에도 제목의 개수·미리보기가 낡은 채 남는다. commentId는 전역 유니크라
  // 대목 변경 등으로 다른 의견이 열리면 find가 비어 답글 뷰가 저절로 서지 않는다.
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const replyTarget =
    commentsState.comments.find((comment) => comment.commentId === replyTargetId) ?? null

  const closeTopLayer = () => {
    if (replyTarget) {
      setReplyTargetId(null)
      return
    }
    onClose()
  }

  return (
    <BottomSheet
      open={trace !== null}
      tone="dark"
      title={
        replyTarget
          ? `답글 (${String(replyTarget.replyCount)})`
          : `댓글 (${String(shownTrace?.commentCount ?? 0)})`
      }
      // ←는 답글 뷰에서만 선다 — 어디로 돌아가는지(댓글 뷰)가 눈에 보이는 길이다
      onBack={replyTarget ? closeTopLayer : undefined}
      onClose={closeTopLayer}
      // 이미 어두운 의견 시트 위에 겹치는 시트라 한 겹 더 어둡게 덮지 않는다
      dim={false}
      // 백드롭이 투명해 바깥 탭으로 닫는 길이 눈에 보이지 않는다 — 내리는 길을 손잡이로 드러낸다.
      // 아래 의견 시트와 같은 손잡이(SheetHandle)라 두 겹이 같은 손짓으로 다뤄진다
      showHandle
      // 끝까지 올린 의견 시트와 같은 자리에 선다 — 두 시트의 윗면이 어긋나면 겹쳐 올라올 때
      // 아래 시트의 모서리가 살짝 비어져 나와 두 겹이라는 사실이 드러난다
      popupStyle={{ height: `calc(100dvh - var(--safe-top) - ${px(SHEET_TOP_EXPANDED)})` }}
      // pb-0: 하단 인셋은 안쪽에서 소비한다 — 패널이 먼저 먹으면 검은 입력바 아래로 시트 바닥이 띠로 남는다
      popupClassName="pb-0"
      contentClassName="min-h-0 flex-1 gap-0 p-0"
    >
      {shownTrace &&
        (replyTarget ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <ReplyThreadSection
                comment={replyTarget}
                myUserId={commentsState.myUserId}
                onUpdate={commentsState.update}
                onRemove={commentsState.remove}
              />
            </div>
            <TraceReplyComposer
              opinionId={shownTrace.opinionId}
              parentCommentId={replyTarget.commentId}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              {/* 원본 의견은 댓글의 머리라 자르지 않고 전부 보여준다.
                  onOpenComments를 넘기지 않아 개수는 버튼이 아니라 표시로만 남는다 — 이미 그 화면이다 */}
              <TraceItem trace={shownTrace} isContentClamped={false} />
              <TraceCommentSection commentsState={commentsState} onOpenReplies={setReplyTargetId} />
            </div>
            <TraceCommentComposer opinionId={shownTrace.opinionId} />
          </div>
        ))}
    </BottomSheet>
  )
}
