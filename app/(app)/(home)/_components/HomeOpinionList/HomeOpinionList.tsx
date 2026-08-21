'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { useMemo, useRef } from 'react'

import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type UserOpinion, userQueries } from '@/app/_global/_queries/user.queries'

import { HomeOpinionCard } from '../HomeOpinionCard/HomeOpinionCard'

const HOME_OPINION_CARD_TONES = ['yellow', 'gray', 'white'] as const

type HomeOpinionCardLayout = {
  className: string
  height: number
  left: number
  top: number
  zIndex: number
}

const HOME_OPINION_LAYOUT_PATTERN = [
  {
    className: 'h-[270.111px] w-[213.333px] -rotate-[3.5deg]',
    height: 270.111,
    left: 128,
    top: 0,
    zIndex: 10,
  },
  {
    className: 'h-[270.111px] w-[213.333px] rotate-[3.5deg]',
    height: 270.111,
    left: 22.39,
    top: 152.47,
    zIndex: 20,
  },
  { className: 'h-[260px] w-[200px]', height: 260, left: 154, top: 337.47, zIndex: 30 },
  {
    className: 'h-[260px] w-[200px] -rotate-[3.5deg]',
    height: 260,
    left: 18,
    top: 548,
    zIndex: 40,
  },
  {
    className: 'h-[260px] w-[200px] rotate-[3.5deg]',
    height: 260,
    left: 151,
    top: 680,
    zIndex: 50,
  },
  { className: 'h-[260px] w-[200px]', height: 260, left: 26, top: 878, zIndex: 60 },
] as const
const HOME_OPINION_ONE_ITEM_LAYOUT_PATTERN = [
  {
    className: 'h-[320px] w-[246px]',
    height: 320,
    left: 64.5,
    top: 82.47,
    zIndex: 10,
  },
] as const
const HOME_OPINION_TWO_ITEM_LAYOUT_PATTERN = [
  {
    className: 'h-[270.111px] w-[213.333px] -rotate-[3.5deg]',
    height: 270.111,
    left: 128.61,
    top: 15.47,
    zIndex: 10,
  },
  {
    className: 'h-[270.111px] w-[213.333px] rotate-[3.5deg]',
    height: 270.111,
    left: 34,
    top: 189.47,
    zIndex: 20,
  },
] as const
const HOME_OPINION_SKELETON_LAYOUT_PATTERN = [
  {
    className: 'h-[270.111px] w-[213.333px] -rotate-3',
    left: 128.33,
    top: 0,
    zIndex: 10,
  },
  {
    className: 'h-[270.111px] w-[213.333px] rotate-3',
    left: 9.33,
    top: 153.41,
    zIndex: 20,
  },
  {
    className: 'h-[260px] w-[200px]',
    left: 155,
    top: 366.47,
    zIndex: 30,
  },
] as const
const HOME_OPINION_LAYOUT_GROUP_HEIGHT = 1080
const HOME_OPINION_LAYOUT_BOTTOM_PADDING = 24

function getHomeOpinionCardTone(index: number): (typeof HOME_OPINION_CARD_TONES)[number] {
  return HOME_OPINION_CARD_TONES[index % HOME_OPINION_CARD_TONES.length] ?? 'yellow'
}

function getHomeOpinionLayoutPattern(opinionCount: number) {
  if (opinionCount === 1) return HOME_OPINION_ONE_ITEM_LAYOUT_PATTERN
  return opinionCount === 2 ? HOME_OPINION_TWO_ITEM_LAYOUT_PATTERN : HOME_OPINION_LAYOUT_PATTERN
}

function getHomeOpinionCardLayout(index: number, opinionCount: number): HomeOpinionCardLayout {
  const pattern = getHomeOpinionLayoutPattern(opinionCount)
  const layout = pattern[index % pattern.length]
  const groupIndex = Math.floor(index / pattern.length)
  const groupTop = groupIndex * HOME_OPINION_LAYOUT_GROUP_HEIGHT

  return {
    ...(layout ?? pattern[0]),
    top: (layout?.top ?? 0) + groupTop,
    zIndex: (layout?.zIndex ?? 10) + groupIndex * pattern.length * 10,
  }
}

function getHomeOpinionCardStyle(index: number, opinionCount: number): CSSProperties {
  const layout = getHomeOpinionCardLayout(index, opinionCount)

  return {
    left: layout.left,
    top: layout.top,
    zIndex: layout.zIndex,
  }
}

function getHomeOpinionLayoutHeight(opinionCount: number): number {
  if (opinionCount <= 0) return 0

  return (
    Math.max(
      ...Array.from({ length: opinionCount }, (_, index) => {
        const layout = getHomeOpinionCardLayout(index, opinionCount)

        return layout.top + layout.height
      }),
    ) + HOME_OPINION_LAYOUT_BOTTOM_PADDING
  )
}

function getHomeOpinionListClassName(opinionCount: number): string {
  return opinionCount <= 2 ? 'overflow-visible' : '-mt-[24.5px] overflow-visible'
}

function HomeOpinionSkeletonCard() {
  return (
    <div className="flex h-[260px] w-[200px] flex-col justify-between bg-[#f0f0f0] p-4">
      <div className="flex w-full flex-col gap-2.5">
        <div className="h-4 w-full rounded bg-[#e6e6e6]" />
        <div className="h-3 w-full rounded bg-[#e6e6e6]" />
      </div>
      <div className="h-[120px] w-full rounded bg-[#e6e6e6]" />
      <div className="flex w-[155.25px] items-center justify-between">
        <div className="h-[9px] w-[18px] rounded bg-[#e6e6e6]" />
        <div className="h-[9px] w-[38.25px] rounded bg-[#e6e6e6]" />
      </div>
    </div>
  )
}

function HomeOpinionListSkeleton() {
  return (
    <div className="-mt-[24.5px] h-[650px] overflow-visible">
      <div className="relative left-1/2 h-full w-[375px] -translate-x-1/2">
        {HOME_OPINION_SKELETON_LAYOUT_PATTERN.map((layout, index) => (
          <div
            key={index}
            className={`absolute flex items-center justify-center ${layout.className}`}
            style={{ left: layout.left, top: layout.top, zIndex: layout.zIndex }}
          >
            <HomeOpinionSkeletonCard />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeOpinionList({ showSampleLabel }: { showSampleLabel: boolean }) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const opinionListQuery = useInfiniteQuery(userQueries.opinionList())
  const opinions = useMemo<UserOpinion[]>(
    () => opinionListQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [opinionListQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootMargin: '160px 0px',
    enabled:
      opinionListQuery.hasNextPage &&
      !opinionListQuery.isError &&
      !opinionListQuery.isFetchingNextPage,
    onLoadMore: () => {
      void opinionListQuery.fetchNextPage()
    },
  })

  if (opinionListQuery.isPending) return <HomeOpinionListSkeleton />

  if (opinionListQuery.isError && opinions.length === 0) {
    return (
      <div className="flex min-h-65 items-center px-4 pb-6">
        <ApiErrorFeedbackState
          aria-label="홈 의견 목록 오류"
          className="w-full"
          title="의견을 불러오지 못했어요."
          onRetry={() => {
            void opinionListQuery.refetch()
          }}
        />
      </div>
    )
  }

  if (opinions.length === 0) {
    return (
      <div className="flex min-h-65 items-center px-4 pb-6">
        <FeedbackState
          aria-label="빈 홈 내 의견"
          className="w-full"
          message="아직 남긴 의견이 없어요"
        />
      </div>
    )
  }

  return (
    <div className={getHomeOpinionListClassName(opinions.length)}>
      <ul
        className="relative left-1/2 w-[375px] -translate-x-1/2"
        style={{ height: getHomeOpinionLayoutHeight(opinions.length) }}
      >
        {opinions.map((opinion, index) => (
          <li
            key={opinion.opinionId}
            className="absolute"
            style={getHomeOpinionCardStyle(index, opinions.length)}
          >
            <HomeOpinionCard
              className={getHomeOpinionCardLayout(index, opinions.length).className}
              opinion={opinion}
              showSampleLabel={showSampleLabel && index < 2}
              tone={getHomeOpinionCardTone(index)}
            />
          </li>
        ))}
      </ul>
      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
    </div>
  )
}
