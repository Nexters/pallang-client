'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef } from 'react'

import { FeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import {
  type UserOpinion,
  type UserOpinionScope,
  userQueries,
} from '@/app/_global/_queries/user.queries'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'

/** 두 화면이 제목·빈 문구만 다르다 — 목록 구조는 그대로 공유한다 */
const SCOPE_TEXT = {
  mine: { title: '내가 남긴 흔적', empty: '아직 남긴 흔적이 없어요' },
  liked: { title: '좋아요 누른 흔적', empty: '아직 좋아요를 누른 흔적이 없어요' },
} as const

// ponytail: 확정 디자인이 없다 — 도서 목록(BookItem) 톤을 따른 1차 구현.
export function MyOpinionListView({ scope }: { scope: UserOpinionScope }) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const listQuery = useInfiniteQuery(userQueries.opinionList(scope))
  const opinions = useMemo<UserOpinion[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [listQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: scrollRef,
    enabled: listQuery.hasNextPage && !listQuery.isError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <OpinionListSkeleton />
    if (listQuery.isError && opinions.length === 0) {
      return (
        <FeedbackState
          aria-label={`${SCOPE_TEXT[scope].title} 오류`}
          message={
            <>
              목록을 불러오지 못했어요.
              <br />
              다시 시도해주세요!
            </>
          }
          actionLabel="다시 시도"
          onAction={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (opinions.length === 0) {
      return (
        <FeedbackState
          aria-label={`빈 ${SCOPE_TEXT[scope].title}`}
          message={SCOPE_TEXT[scope].empty}
        />
      )
    }
    return (
      <>
        <ul className="flex flex-col divide-y divide-border-default">
          {opinions.map((opinion) => (
            <li key={opinion.opinionId} className="py-3 first:pt-0 last:pb-0">
              <OpinionItem opinion={opinion} />
            </li>
          ))}
        </ul>
        {/* 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다 */}
        <div ref={loadMoreRef} aria-hidden className="h-6 w-full" />
      </>
    )
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      {/* 셸(TopBar)은 데이터를 기다리지 않는다 — 목록 자리만 골격으로 채운다 */}
      <TopBar.Root>
        <TopBar.Action
          aria-label="뒤로 가기"
          onClick={() => {
            router.back()
          }}
        >
          <BackIcon />
        </TopBar.Action>
        <TopBar.Title as="h1">{SCOPE_TEXT[scope].title}</TopBar.Title>
        <TopBar.Spacer />
      </TopBar.Root>

      <div
        ref={scrollRef}
        className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {renderList()}
      </div>
    </main>
  )
}

function OpinionItem({ opinion }: { opinion: UserOpinion }) {
  return (
    <Link
      href={buildTraceTargetHref(opinion.bookId, {
        pageNumber: opinion.pageNumber,
        passageId: opinion.passageId,
        opinionId: opinion.opinionId,
      })}
      className="press flex w-full items-start gap-4"
    >
      <div
        aria-hidden="true"
        className="h-24 w-16 shrink-0 rounded-xs border border-border-book/10 bg-bg-book-card bg-cover bg-center"
        style={
          opinion.bookCoverImageUrl
            ? { backgroundImage: `url(${opinion.bookCoverImageUrl})` }
            : undefined
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="w-full truncate text-title-16sb text-text-primary">{opinion.bookTitle}</h2>
        <p className="line-clamp-1 w-full text-body-14md text-text-tertiary">
          {opinion.pageNumber}p · {opinion.quotedText}
        </p>
        <p className="line-clamp-2 w-full text-body-14md text-text-secondary">{opinion.content}</p>
        <div className="flex items-center gap-2 text-body-14rg text-text-tertiary">
          <span className="flex items-center gap-0.5">
            <LikeIcon width={16} height={16} className="text-icon-muted" />
            {opinion.likeCount}
          </span>
          {/* 상대 시각 표기는 프리렌더에서 쓸 수 없어(현재 시각) 서버가 준 날짜를 그대로 보여준다 */}
          <span>{opinion.createdAt.slice(0, 10).replaceAll('-', '.')}</span>
        </div>
      </div>
    </Link>
  )
}

/** 목록과 같은 좌표(표지 64×96 + gap-4)로 자리를 지킨다 */
function OpinionListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex w-full items-start gap-4">
          <Skeleton className="h-24 w-16 shrink-0 rounded-xs" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
