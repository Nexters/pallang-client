'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Select } from '@/app/_global/_components/Select/Select'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type LikedOpinion, userQueries } from '@/app/_global/_queries/user.queries'

import { LikedOpinionCard } from '../LikedOpinionCard/LikedOpinionCard'

/** 책을 고르지 않은 상태. Select는 문자열 값만 다뤄 숫자 bookId와 섞이지 않을 이름을 쓴다. */
const ALL_BOOKS = 'all'

/** 좋아요를 되돌릴 대상 — 스낵바가 닫히거나 필터가 바뀌면 비운다 */
type UnlikedTarget = { nickname: string; undo: () => void }

export function LikedOpinionsView() {
  const [selectedBook, setSelectedBook] = useState<string>(ALL_BOOKS)
  const [unliked, setUnliked] = useState<UnlikedTarget | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const bookId = selectedBook === ALL_BOOKS ? undefined : Number(selectedBook)
  const listQuery = useInfiniteQuery(userQueries.likedOpinionList(bookId))
  const booksQuery = useQuery(userQueries.filterBooks('LIKE'))

  const opinions = useMemo<LikedOpinion[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
    [listQuery.data],
  )

  // ponytail: 서버가 준 순서를 그대로 전부 내보낸다. 정렬 기준과 개수 상한을 백엔드에서 아직
  // 받지 못해, 프론트에서 임의로 자르거나 다시 정렬하면 서버가 정할 규칙과 어긋난다.
  // 넘치는 만큼은 Select 팝업이 스크롤한다.
  const bookOptions = useMemo(
    () => [
      { label: '전체 책 보기', value: ALL_BOOKS },
      ...(booksQuery.data?.data?.books ?? []).map((book) => ({
        label: book.title,
        value: String(book.bookId),
      })),
    ],
    [booksQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: listQuery.hasNextPage && !listQuery.isError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <LikedOpinionsSkeleton />
    if (listQuery.isError && opinions.length === 0) {
      return (
        <ApiErrorFeedbackState
          aria-label="좋아요 관리 오류"
          title="목록을 불러오지 못했어요."
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (opinions.length === 0) {
      // 시안(225:12791)의 빈 상태는 일러스트 없이 문구 한 줄뿐이라 FeedbackState를 쓰지 않는다
      return (
        <p className="flex flex-1 items-center justify-center text-center text-title-18md text-text-secondary">
          등록한 좋아요가 없습니다
        </p>
      )
    }
    return (
      <>
        <ul className="flex flex-col gap-2">
          {opinions.map((opinion) => (
            <li key={opinion.opinionId}>
              <LikedOpinionCard opinion={opinion} onUnlike={setUnliked} />
            </li>
          ))}
        </ul>
        {/* 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다 */}
        <div ref={loadMoreRef} aria-hidden className="h-6 w-full shrink-0" />
      </>
    )
  }

  return (
    <>
      <ScreenLayout title="좋아요 관리">
        <div className="flex shrink-0 justify-end px-4 py-2">
          <Select
            label="도서 필터"
            tone="light"
            options={bookOptions}
            value={selectedBook}
            onValueChange={(value) => {
              setSelectedBook(value)
              // 필터를 바꾸면 되돌릴 카드가 화면에서 사라질 수 있어 안내도 함께 접는다
              setUnliked(null)
            }}
            // 시안(225:12790)의 트리거는 140px 고정 폭에 값이 왼쪽, 화살표가 오른쪽 끝이다
            className="w-35 justify-between px-2.5 text-body-14sb"
          />
        </div>

        {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다(Figma 225:12749) */}
        <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">{renderList()}</div>
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar
        tone="light"
        message={unliked ? `${unliked.nickname}님의 좋아요를 해제했어요` : ''}
        actionLabel="취소"
        onAction={() => {
          unliked?.undo()
          setUnliked(null)
        }}
        onClose={() => {
          setUnliked(null)
        }}
      />
    </>
  )
}

/** 목록과 같은 좌표(카드 gap-2 + p-4 + 머리줄·점선·본문 3줄)로 자리를 지킨다 */
function LikedOpinionsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 border border-border-book bg-bg-default p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="size-5" />
          </div>
          <div className="border-t border-dashed border-border-book" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
