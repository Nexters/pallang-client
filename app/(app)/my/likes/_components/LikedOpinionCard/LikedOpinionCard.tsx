'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import type { LikedOpinion } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { useOpinionLike } from '@/app/_shared/trace/_hooks/useOpinionLike'

type LikedOpinionCardProps = {
  opinion: LikedOpinion
  /** 하트를 꺼서 좋아요가 풀렸을 때 — 되돌릴 수 있게 다시 켜는 함수를 함께 넘긴다 */
  onUnlike: (unliked: { nickname: string; undo: () => void }) => void
}

/**
 * 좋아요 관리 목록의 카드 하나(Figma 225:12750).
 * 표지 없이 `{쪽수}p · 닉네임` 머리줄 + 점선 + 흔적 본문만 담는다.
 */
export function LikedOpinionCard({ opinion, onUnlike }: LikedOpinionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)

  // 목록에 실려 온 흔적은 모두 내가 좋아요를 누른 것이라 기준값은 언제나 눌린 상태다
  const like = useOpinionLike(opinion.opinionId, { liked: true, likeCount: opinion.likeCount })

  // 접힌 상태에서만 잰다 — 펼친 뒤에는 넘칠 일이 없어 다시 재면 `더보기`가 사라진다
  useEffect(() => {
    const element = contentRef.current
    if (!element) return
    setOverflowing(element.scrollHeight > element.clientHeight)
  }, [opinion.content])

  return (
    <article className="relative flex flex-col gap-4 border border-border-book bg-bg-default p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-body-14md">
          <span className="shrink-0 text-label-strong">{opinion.pageNumber}p</span>
          <span className="truncate text-text-tertiary">{opinion.nickname}</span>
        </div>
        <button
          type="button"
          aria-label="좋아요"
          aria-pressed={like.isLiked}
          onClick={() => {
            const wasLiked = like.isLiked
            like.toggle()
            if (wasLiked) onUnlike({ nickname: opinion.nickname, undo: like.toggle })
          }}
          className="relative z-10 flex size-5 shrink-0 items-center justify-center press"
        >
          <LikeIcon
            width={20}
            height={20}
            className={cn('size-5', like.isLiked ? 'text-icon-accent' : 'text-icon-muted')}
          />
        </button>
      </div>

      {/* 머리줄과 본문을 가르는 점선(Figma 225:12756) — SVG 대신 CSS라 카드 너비를 따라 늘어난다 */}
      <div aria-hidden className="border-t border-dashed border-border-book" />

      <div className="flex flex-col items-end gap-1">
        <p
          ref={contentRef}
          // 접힌 본문은 세 줄까지만 보인다(Figma 225:12750)
          className={cn('w-full text-body-16md text-text-secondary', !expanded && 'line-clamp-3')}
        >
          {opinion.content}
        </p>
        {/* 시안에 접힌 상태로 되돌리는 자리가 없어 한 번 펼치면 그대로 둔다 */}
        {overflowing && !expanded && (
          <button
            type="button"
            onClick={() => {
              setExpanded(true)
            }}
            className="relative z-10 flex items-center gap-0.5 px-2 py-1 text-body-14rg text-text-primary press"
          >
            더보기
            <ChevronDownIcon width={20} height={20} className="size-5 text-icon-primary" />
          </button>
        )}
      </div>

      {/* 시안 카드에는 이동 어피던스가 없지만, 기존 화면처럼 카드를 눌러 그 흔적으로 갈 수 있어야 한다.
          카드를 덮는 링크로 두고 하트·더보기만 z-10으로 위에 띄운다 — 링크 안에 버튼을 넣으면 안 된다. */}
      <Link
        href={buildTraceTargetHref(opinion.bookId, {
          pageNumber: opinion.pageNumber,
          passageId: opinion.passageId,
          opinionId: opinion.opinionId,
        })}
        aria-label={`${opinion.nickname}님의 흔적 보기`}
        className="absolute inset-0"
      />
    </article>
  )
}
