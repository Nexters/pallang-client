import { useQuery } from '@tanstack/react-query'

import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { commentQueries } from '@/app/_global/_queries/comment.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { useCommentActions } from '../../_hooks/useCommentActions'
import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { CommentBar } from '../CommentBar/CommentBar'
import { CommentThread } from '../CommentThread/CommentThread'
import { QuotePanel } from '../QuotePanel/QuotePanel'

type TraceDetailOverlayProps = {
  trace: Trace
  index: number
  count: number
  quote: string
  /** 전환 상태. 넘기지 않으면 애니메이션 없이 그대로 보인다 */
  state?: ExitTransitionState
  onNavigate: (index: number) => void
  onClose: () => void
}

export function TraceDetailOverlay({
  trace,
  index,
  count,
  quote,
  state,
  onNavigate,
  onClose,
}: TraceDetailOverlayProps) {
  const runWithLogin = useLoginGate()
  const { data: commentsData } = useQuery(commentQueries.listByOpinion(trace.opinionId))
  // 비로그인이면 me 조회가 실패해 myUserId가 없고, 수정·삭제 버튼이 숨겨진다
  const { data: meData } = useQuery(userQueries.me())
  const actions = useCommentActions(trace.opinionId)
  const like = useOpinionLike(trace.opinionId, trace.likeCount)

  const comments = commentsData?.data?.comments ?? []
  const myUserId = meData?.data?.userId

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="의견 상세"
      data-state={state}
      className={cn(
        'fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark',
        // 목록 위로 올라와 덮는 모달 프레젠테이션 — 좌우는 이전/다음 의견 이동이라 세로로 움직인다
        'transition-transform duration-slow ease-enter',
        'data-[state=entering]:translate-y-full',
        'data-[state=exiting]:translate-y-full data-[state=exiting]:ease-exit',
      )}
    >
      <TopBar.Root className="bg-bg-book-card">
        <TopBar.Action
          aria-label="이전 의견"
          disabled={index === 0}
          onClick={() => {
            onNavigate(index - 1)
          }}
          className="disabled:opacity-30"
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title>{trace.nickname}</TopBar.Title>
        <TopBar.Action
          aria-label="다음 의견"
          disabled={index === count - 1}
          onClick={() => {
            onNavigate(index + 1)
          }}
          className="disabled:opacity-30"
        >
          <NextIcon />
        </TopBar.Action>
        <TopBar.Spacer />
        <TopBar.Action aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <QuotePanel quote={quote} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <p className="text-body-16md text-text-inverse">{trace.content}</p>
        <div className="flex items-center justify-between text-body-14rg text-text-inverse">
          <span className="opacity-50">{formatTraceDate(trace.createdAt)}</span>
          <button
            type="button"
            aria-label="좋아요"
            aria-pressed={like.isLiked}
            onClick={() => {
              runWithLogin(like.toggle, LOGIN_GATE_MESSAGE.like)
            }}
            className="flex items-center gap-0.5"
          >
            <LikeIcon
              width={20}
              height={20}
              className={like.isLiked ? 'text-icon-accent' : 'text-icon-active'}
            />
            공감 {formatLikeCount(like.likeCount)}
          </button>
        </div>
        <p className="text-body-14sb text-text-inverse">댓글</p>
        {comments.map((comment) => (
          <CommentThread
            key={comment.commentId}
            comment={comment}
            myUserId={myUserId}
            onUpdate={(commentId, content) => {
              actions.update.mutate({ commentId, content })
            }}
            onRemove={(commentId) => {
              actions.remove.mutate(commentId)
            }}
          />
        ))}
      </div>
      <CommentBar
        onSubmit={(content) => {
          runWithLogin(() => {
            actions.create.mutate(content)
          }, LOGIN_GATE_MESSAGE.commentCreate)
        }}
      />
    </div>
  )
}
