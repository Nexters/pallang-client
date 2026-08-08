import { useSyncExternalStore } from 'react'

import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { ModerationMenu } from '../ModerationMenu/ModerationMenu'

type TraceItemProps = {
  trace: Trace
  /** 댓글이 이 흔적 아래로 펼쳐져 있는지 — 아코디언이라 한 번에 하나만 true다 */
  isCommentOpen: boolean
  onSelect: () => void
  onToggleComment: () => void
}

const noop = () => undefined
const emptySubscribe = () => noop

export function TraceItem({ trace, isCommentOpen, onSelect, onToggleComment }: TraceItemProps) {
  const runWithLogin = useLoginGate()
  const { isLiked, likeCount, toggle } = useOpinionLike(trace.opinionId, trace.likeCount)
  // 프리렌더에서는 현재 시각을 쓸 수 없어 결정적인 날짜로 먼저 그리고, hydration 후 상대 표기로 바꾼다
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const dateLabel = isHydrated ? formatTraceDate(trace.createdAt) : trace.createdAt.slice(0, 10)

  return (
    <article className="flex flex-col gap-3 py-4">
      <div className="flex items-center justify-between">
        <button type="button" className="flex items-center gap-0.5 opacity-40">
          <span className="text-body-14sb text-text-inverse">{trace.nickname}</span>
          <NextIcon width={16} height={16} className="text-icon-active" />
        </button>
        <ModerationMenu
          target={{ type: 'opinion', id: trace.opinionId }}
          authorUserId={trace.userId}
          authorNickname={trace.nickname}
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="line-clamp-3 text-left text-body-16md text-text-inverse"
      >
        {trace.content}
      </button>
      <div className="flex items-center justify-between">
        <span className="text-body-14rg text-text-inverse opacity-50">{dateLabel}</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="좋아요"
            aria-pressed={isLiked}
            onClick={() => {
              runWithLogin(toggle, LOGIN_GATE_MESSAGE.like)
            }}
            className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
          >
            <LikeIcon
              width={20}
              height={20}
              className={isLiked ? 'text-icon-accent' : 'text-icon-active'}
            />
            {formatCount(likeCount)}
          </button>
          <button
            type="button"
            onClick={onToggleComment}
            aria-label="댓글 보기"
            aria-expanded={isCommentOpen}
            className="flex items-center gap-0.5 text-body-14rg text-text-inverse"
          >
            <CommentIcon width={20} height={20} className="text-icon-active" />
            {formatCount(trace.commentCount)}
          </button>
        </div>
      </div>
    </article>
  )
}
