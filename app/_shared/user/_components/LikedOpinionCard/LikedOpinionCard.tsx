'use client'

import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import type { LikedOpinion } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { useOpinionLike } from '@/app/_shared/trace/_hooks/useOpinionLike'
import { RecordCard } from '@/app/_shared/user/_components/RecordCard/RecordCard'

type LikedOpinionCardProps = {
  opinion: LikedOpinion
  /** 하트를 꺼서 좋아요가 풀렸을 때 — 되돌릴 수 있게 다시 켜는 함수를 함께 넘긴다 */
  onUnlike: (unliked: { nickname: string; undo: () => void }) => void
}

/**
 * 좋아요 관리 목록의 카드 하나.
 * 틀은 `RecordCard`가 갖고, 여기서는 좋아요에만 있는 것(닉네임 머리줄·하트 토글·흔적 좌표)을 채운다.
 */
export function LikedOpinionCard({ opinion, onUnlike }: LikedOpinionCardProps) {
  // 목록에 실려 온 흔적은 모두 내가 좋아요를 누른 것이라 기준값은 언제나 눌린 상태다
  const like = useOpinionLike(opinion.opinionId, { liked: true, likeCount: opinion.likeCount })

  return (
    <RecordCard
      pageNumber={opinion.pageNumber}
      meta={opinion.nickname}
      body={opinion.content}
      link={{
        href: buildTraceTargetHref(opinion.bookId, {
          pageNumber: opinion.pageNumber,
          passageId: opinion.passageId,
          opinionId: opinion.opinionId,
        }),
        label: `${opinion.nickname}님의 흔적 보기`,
      }}
      action={
        <button
          type="button"
          aria-label="좋아요"
          aria-pressed={like.isLiked}
          onClick={() => {
            const wasLiked = like.isLiked
            like.toggle()
            if (wasLiked) onUnlike({ nickname: opinion.nickname, undo: like.toggle })
          }}
          className="flex size-5 items-center justify-center press"
        >
          <LikeIcon
            width={20}
            height={20}
            className={cn('size-5', like.isLiked ? 'text-icon-accent' : 'text-icon-muted')}
          />
        </button>
      }
    />
  )
}
