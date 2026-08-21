import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import { ProfileAvatar } from '@/app/_global/_components/ProfileAvatar/ProfileAvatar'
import { useIsHydrated } from '@/app/_global/_hooks/useIsHydrated'
import { cn } from '@/app/_global/_services/cn.service'

import { formatCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { ModerationMenu } from '../ModerationMenu/ModerationMenu'
import { TraceLikeButton } from '../TraceLikeButton/TraceLikeButton'

type TraceItemProps = {
  trace: Trace
  /** 본문 3줄 클램프 여부 — 댓글 시트의 원본 카드는 전체를 그대로 보여준다 */
  isContentClamped?: boolean
  /** 본문 탭 동작. 없으면 본문은 버튼이 아니라 문단으로 그려진다 */
  onSelect?: () => void
  /** 댓글 시트로 가는 동작. 없으면(이미 댓글 시트 안) 개수는 버튼이 아니라 표시로만 남는다 */
  onOpenComments?: () => void
}

/** 좋아요·댓글·더보기는 시안에서 모두 같은 알약이다 — 한 벌로 묶어 세 곳이 어긋나지 않게 한다 */
const PILL = 'rounded-lg bg-bg-overlay'

export function TraceItem({
  trace,
  isContentClamped = true,
  onSelect,
  onOpenComments,
}: TraceItemProps) {
  // 프리렌더에서는 현재 시각을 쓸 수 없어 결정적인 날짜로 먼저 그리고, hydration 후 상대 표기로 바꾼다
  const isHydrated = useIsHydrated()

  const commentCount = (
    <>
      <CommentIcon width={20} height={20} className="text-icon-active" />
      {formatCount(trace.commentCount)}
    </>
  )

  return (
    <article className="flex flex-col gap-4 py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* 의견 목록 응답(OpinionSummaryResponse)에는 프로필 이미지가 없다 —
              모두 기본 캐릭터로 선다. 필드가 생기면 src만 넘기면 된다 */}
          <ProfileAvatar size={32} />
          {/* 닉네임과 날짜의 밝기 차이가 시안의 위계다 — 이름은 또렷하게, 시각은 흐리게 */}
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-body-14sb text-text-inverse">{trace.nickname}</span>
            <span className="text-caption-12rg text-text-inverse/50">
              {formatTraceDate(trace.createdAt, { isHydrated })}
            </span>
          </span>
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
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TraceLikeButton
            opinionId={trace.opinionId}
            likeCount={trace.likeCount}
            liked={trace.liked}
            className={cn(PILL, 'px-1.5 py-1')}
          />
          {onOpenComments ? (
            <button
              type="button"
              onClick={onOpenComments}
              aria-label="댓글 보기"
              className={cn(
                PILL,
                'press flex items-center gap-0.5 px-1.5 py-1 text-body-14rg text-text-inverse',
              )}
            >
              {commentCount}
            </button>
          ) : (
            <span
              className={cn(
                PILL,
                'flex items-center gap-0.5 px-1.5 py-1 text-body-14rg text-text-inverse',
              )}
            >
              {commentCount}
            </span>
          )}
        </div>
        <ModerationMenu
          target={{ type: 'opinion', id: trace.opinionId }}
          authorUserId={trace.userId}
          authorNickname={trace.nickname}
          triggerClassName={cn(PILL, 'size-7 p-1')}
        />
      </div>
    </article>
  )
}
