'use client'

import { useEffect, useRef } from 'react'

import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import type { LikedOpinion } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { useOpinionLike } from '@/app/_shared/trace/_hooks/useOpinionLike'
import { RecordCard } from '@/app/_shared/user/_components/RecordCard/RecordCard'

type LikedOpinionCardProps = {
  opinion: LikedOpinion
  /**
   * 하트를 꺼서 좋아요가 풀렸을 때 — 다시 켜는 함수를 함께 넘긴다.
   * `undo`는 토글이 아니라 복구다. 이미 켜져 있으면 아무 일도 하지 않는다.
   */
  onUnlike: (unliked: { opinionId: number; nickname: string; undo: () => void }) => void
  /** 하트를 직접 다시 켰을 때 — 되돌릴 것이 없어졌으니 안내를 걷으라고 알린다 */
  onRelike?: (opinionId: number) => void
}

/**
 * 좋아요 관리 목록의 카드 하나.
 * 틀은 `RecordCard`가 갖고, 여기서는 좋아요에만 있는 것(닉네임 머리줄·하트 토글·흔적 좌표)을 채운다.
 */
export function LikedOpinionCard({ opinion, onUnlike, onRelike }: LikedOpinionCardProps) {
  // 목록에 실려 온 흔적은 모두 내가 좋아요를 누른 것이라 기준값은 언제나 눌린 상태다
  const like = useOpinionLike(opinion.opinionId, { liked: true, likeCount: opinion.likeCount })

  // 되돌리기 함수는 안내 쪽이 들고 있다가 나중에 부른다 — 그 사이 하트를 다시 눌렀을 수 있어
  // 넘겨줄 때의 값이 아니라 부르는 시점의 값을 읽어야 한다
  const likeRef = useRef(like)
  useEffect(() => {
    likeRef.current = like
  })

  /** 토글이 아니라 복구다 — 이미 켜져 있으면 요청을 보내지 않는다 */
  function restoreLike() {
    if (!likeRef.current.isLiked) likeRef.current.toggle()
  }

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
          // 행마다 같은 이름이면 스크린리더에서 어느 카드의 하트인지 가릴 수 없다
          aria-label={`${opinion.nickname}님의 흔적 좋아요`}
          aria-pressed={like.isLiked}
          onClick={() => {
            const wasLiked = like.isLiked
            like.toggle()
            if (wasLiked) {
              onUnlike({
                opinionId: opinion.opinionId,
                nickname: opinion.nickname,
                undo: restoreLike,
              })
            } else {
              onRelike?.(opinion.opinionId)
            }
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
