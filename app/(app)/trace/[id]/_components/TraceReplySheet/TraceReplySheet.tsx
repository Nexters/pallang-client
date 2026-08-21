'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import type { RootCommentResponse } from '@/app/_global/_queries/comment.queries'

import { px, SHEET_TOP_EXPANDED } from '../../_data/quoteStage.constant'
import { ReplyThreadSection } from '../ReplyThreadSection/ReplyThreadSection'
import { TraceReplyComposer } from '../TraceReplyComposer/TraceReplyComposer'

type TraceReplySheetProps = {
  opinionId: number
  /** 답글을 보고 있는 원댓글 — null이면 시트가 내려가 있다 */
  comment: RootCommentResponse | null
  myUserId: number | undefined
  onUpdate: (commentId: number, content: string) => void
  onRemove: (commentId: number) => void
  onClose: () => void
}

/**
 * 댓글의 답글로 들어가는 답글 시트(시안 3393-49475) — "← 답글 (N)" 헤더에
 * 원댓글 + `└` 답글 목록 + 답글 입력바가 실린다.
 *
 * 댓글 시트 위로 한 겹 더 올라와 그것을 통째로 덮는다(TraceCommentSheet가 의견 시트를
 * 덮는 것과 같은 문법) — 뒤로가기(←·바깥 탭·Esc)는 이 시트만 접고 댓글 시트를 남긴다.
 */
export function TraceReplySheet({
  opinionId,
  comment,
  myUserId,
  onUpdate,
  onRemove,
  onClose,
}: TraceReplySheetProps) {
  // 내려가는 동안에도 원댓글과 답글이 남아 있어야 퇴장이 빈 시트로 보이지 않는다
  const shownComment = useLastPresent(comment)

  return (
    <BottomSheet
      open={comment !== null}
      tone="dark"
      title={`답글 (${String(shownComment?.replyCount ?? 0)})`}
      // 헤더의 ←가 한 겹만 걷는다 — 어디로 돌아가는지(댓글 시트)가 눈에 보이는 길이다
      onBack={onClose}
      onClose={onClose}
      // 아래 댓글 시트와 같은 이유로 어둠도 손잡이도 그 문법 그대로다
      dim={false}
      showHandle
      popupStyle={{ height: `calc(100dvh - var(--safe-top) - ${px(SHEET_TOP_EXPANDED)})` }}
      popupClassName="pb-0"
      contentClassName="min-h-0 flex-1 gap-0 p-0"
    >
      {shownComment && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            <ReplyThreadSection
              comment={shownComment}
              myUserId={myUserId}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          </div>
          <TraceReplyComposer opinionId={opinionId} parentCommentId={shownComment.commentId} />
        </div>
      )}
    </BottomSheet>
  )
}
