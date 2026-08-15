import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { useIsHydrated } from '@/app/_global/_hooks/useIsHydrated'
import { cn } from '@/app/_global/_services/cn.service'

import { formatCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { ModerationMenu } from '../ModerationMenu/ModerationMenu'
import { TraceLikeButton } from '../TraceLikeButton/TraceLikeButton'

type TraceItemProps = {
  trace: Trace
  /** 본문 3줄 클램프 여부 — 답글 화면의 원본 카드는 전체를 그대로 보여준다 */
  isContentClamped?: boolean
  /** 본문 탭 동작. 없으면 본문은 버튼이 아니라 문단으로 그려진다 */
  onSelect?: () => void
  /** 답글 진입 동작. 없으면(이미 답글 화면) 개수는 버튼이 아니라 표시로만 남는다 */
  onOpenComments?: () => void
  /**
   * 댓글이 이 카드 아래로 펼쳐져 있는지. 흔적 목록처럼 제자리에서 여닫는 자리에서만 넘긴다 —
   * 시트로 넘어가는 자리는 펼침이 아니라 이동이라 aria-expanded를 달면 거짓말이 된다
   */
  isCommentsOpen?: boolean
}

export function TraceItem({
  trace,
  isContentClamped = true,
  onSelect,
  onOpenComments,
  isCommentsOpen,
}: TraceItemProps) {
  // 프리렌더에서는 현재 시각을 쓸 수 없어 결정적인 날짜로 먼저 그리고, hydration 후 상대 표기로 바꾼다
  const isHydrated = useIsHydrated()

  return (
    <article className="flex flex-col gap-3 py-4">
      <div className="flex items-center justify-between">
        {/* 닉네임 줄과 날짜의 밝기 차이가 시안(202:4568)의 위계다 — 닉네임 50%, 날짜 25% */}
        <button type="button" className="flex items-center gap-0.5 opacity-50">
          <span className="text-body-14sb text-text-inverse">{trace.nickname}</span>
          <NextIcon width={16} height={16} className="text-icon-active" />
        </button>
        <ModerationMenu
          target={{ type: 'opinion', id: trace.opinionId }}
          authorUserId={trace.userId}
          authorNickname={trace.nickname}
        />
      </div>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'text-left text-body-16md text-text-inverse',
            isContentClamped && 'line-clamp-3',
          )}
        >
          {trace.content}
        </button>
      ) : (
        <p
          className={cn(
            'break-words text-body-16md text-text-inverse',
            isContentClamped && 'line-clamp-3',
          )}
        >
          {trace.content}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-body-14rg text-text-inverse/25">
          {formatTraceDate(trace.createdAt, { isHydrated })}
        </span>
        <div className="flex items-center gap-4">
          <TraceLikeButton opinionId={trace.opinionId} likeCount={trace.likeCount} />
          {onOpenComments ? (
            <button
              type="button"
              onClick={onOpenComments}
              aria-label="댓글 보기"
              aria-expanded={isCommentsOpen}
              className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
            >
              <CommentIcon width={20} height={20} className="text-icon-active" />
              {formatCount(trace.commentCount)}
            </button>
          ) : (
            <span className="flex items-center gap-0.5 text-body-14rg text-text-inverse">
              <CommentIcon width={20} height={20} className="text-icon-active" />
              {formatCount(trace.commentCount)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
