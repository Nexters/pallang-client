'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Select } from '@/app/_global/_components/Select/Select'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type MyPassage, userQueries } from '@/app/_global/_queries/user.queries'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'
import { SpoilerPassageCard } from '@/app/_shared/user/_components/SpoilerPassageCard/SpoilerPassageCard'
import { SpoilerReleaseDialog } from '@/app/_shared/user/_components/SpoilerReleaseDialog/SpoilerReleaseDialog'

/** 책을 고르지 않은 상태. Select는 문자열 값만 다뤄 숫자 bookId와 섞이지 않을 이름을 쓴다. */
const ALL_BOOKS = 'all'

export function SpoilerPassagesView() {
  const [selectedBook, setSelectedBook] = useState<string>(ALL_BOOKS)
  const [releasing, setReleasing] = useState<MyPassage | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const bookId = selectedBook === ALL_BOOKS ? undefined : Number(selectedBook)
  const listQuery = useInfiniteQuery(userQueries.spoilerPassageList(bookId))
  const booksQuery = useQuery(userQueries.filterBooks('SPOILER'))

  const passages = useMemo<MyPassage[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.passages ?? []) ?? [],
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
    if (listQuery.isPending) return <RecordListSkeleton />
    if (listQuery.isError && passages.length === 0) {
      return (
        <ApiErrorFeedbackState
          aria-label="스포일러 관리 오류"
          title="목록을 불러오지 못했어요."
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      )
    }
    if (passages.length === 0) {
      // 시안의 빈 상태는 일러스트 없이 문구 한 줄뿐이라 FeedbackState를 쓰지 않는다
      return (
        <p className="flex flex-1 items-center justify-center text-center text-title-18md text-text-secondary">
          등록한 스포일러가 없습니다
        </p>
      )
    }
    return (
      <>
        <ul className="flex flex-col gap-2">
          {passages.map((passage) => (
            <li key={passage.passageId}>
              <SpoilerPassageCard passage={passage} onRelease={setReleasing} />
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
      <ScreenLayout title="스포일러 관리">
        <div className="flex shrink-0 justify-end px-4 py-2">
          <Select
            label="도서 필터"
            tone="light"
            options={bookOptions}
            value={selectedBook}
            onValueChange={(value) => {
              setSelectedBook(value)
              // 필터를 바꾸면 열어 둔 대상이 화면에서 사라질 수 있어 다이얼로그도 함께 접는다
              setReleasing(null)
            }}
            // 시안의 트리거는 140px 고정 폭에 값이 왼쪽, 화살표가 오른쪽 끝이다
            className="w-35 justify-between px-2.5 text-body-14sb"
          />
        </div>

        {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다 */}
        <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">{renderList()}</div>
      </ScreenLayout>

      <SpoilerReleaseDialog
        open={releasing !== null}
        onCancel={() => {
          setReleasing(null)
        }}
      />
    </>
  )
}
