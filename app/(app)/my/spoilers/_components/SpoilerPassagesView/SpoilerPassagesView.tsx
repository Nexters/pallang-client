'use client'

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { RetryMessage } from '@/app/_global/_components/RetryMessage/RetryMessage'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Select } from '@/app/_global/_components/Select/Select'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type MyPassage, userQueries } from '@/app/_global/_queries/user.queries'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'
import { SpoilerPassageCard } from '@/app/_shared/user/_components/SpoilerPassageCard/SpoilerPassageCard'
import { SpoilerReleaseDialog } from '@/app/_shared/user/_components/SpoilerReleaseDialog/SpoilerReleaseDialog'
import { useSpoilerRelease } from '@/app/_shared/user/_hooks/useSpoilerRelease'

/** 책을 고르지 않은 상태. Select는 문자열 값만 다뤄 숫자 bookId와 섞이지 않을 이름을 쓴다. */
const ALL_BOOKS = 'all'

export function SpoilerPassagesView() {
  const [selectedBook, setSelectedBook] = useState<string>(ALL_BOOKS)
  const release = useSpoilerRelease()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const booksQuery = useQuery(userQueries.filterBooks('SPOILER'))

  // 서버가 최근 활동순으로 중복 없이 준다 — 프론트에서 다시 자르거나 정렬하지 않고
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

  // 고른 책의 마지막 스포일러를 해제하면 그 책이 필터 목록에서 빠진다. 고른 값을 그대로 두면
  // Select가 라벨을 못 찾아 bookId를 그대로 뿌리고, 목록도 사라진 책으로 걸린 채 남는다.
  // 그래서 고른 값은 요청으로만 두고, 실제로 거는 값은 필터 목록에 있는지 보고 정한다 —
  // 되돌린 값을 state에 다시 쓰면 effect에서 setState가 돌아 렌더가 한 번 더 인다.
  const activeBook = bookOptions.some((option) => option.value === selectedBook)
    ? selectedBook
    : ALL_BOOKS

  const bookId = activeBook === ALL_BOOKS ? undefined : Number(activeBook)
  const listQuery = useInfiniteQuery({
    ...userQueries.spoilerPassageList(bookId),
    // 필터를 바꿀 때마다 캐시 키가 갈려 목록 전체가 스켈레톤으로 번쩍인다 — 새 페이지가 올 때까지
    // 직전 목록을 그대로 둔다
    placeholderData: keepPreviousData,
  })

  const passages = useMemo<MyPassage[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.passages ?? []) ?? [],
    [listQuery.data],
  )

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    // isFetchNextPageError만 끈다. 첫 페이지 실패는 isPending/isError 분기가 이미 처리한다
    enabled:
      listQuery.hasNextPage && !listQuery.isFetchNextPageError && !listQuery.isFetchingNextPage,
    onLoadMore: () => {
      void listQuery.fetchNextPage()
    },
  })

  /** 분기가 넷이라 삼항을 겹치지 않고 guard로 가른다 */
  function renderList() {
    if (listQuery.isPending) return <RecordListSkeleton />
    // 다음 페이지 실패는 아래 재시도 줄이 받는다 — 첫 페이지가 통째로 걸러져 비어 있을 때
    // 여기로 흘러들면 이미 받은 목록 자리가 오류 화면으로 덮인다
    if (listQuery.isError && !listQuery.isFetchNextPageError && passages.length === 0) {
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
    // 다음 페이지가 남아 있으면 비어도 빈 상태로 끝내지 않는다 — sentinel이 유일한 트리거라
    // 여기서 return하면 서버가 첫 20건을 통째로 걸러낸 경우 다음 페이지를 영영 못 부른다
    if (passages.length === 0 && !listQuery.hasNextPage) {
      // 시안의 빈 상태는 일러스트 없이 문구 한 줄뿐이라 FeedbackState를 쓰지 않는다
      return (
        <p className="flex flex-1 items-center justify-center text-center text-title-18md text-text-secondary">
          등록한 스포일러가 없습니다
        </p>
      )
    }
    return (
      <>
        {/* 붙은 페이지가 전부 비었을 뿐 다음 페이지는 남았다 — 자리를 비우지 않고 골격으로 채운다 */}
        {passages.length === 0 && !listQuery.isFetchNextPageError && <RecordListSkeleton />}
        <ul className="flex flex-col gap-2">
          {passages.map((passage) => (
            <li key={passage.passageId}>
              <SpoilerPassageCard passage={passage} onRelease={release.start} />
            </li>
          ))}
        </ul>
        {listQuery.isFetchNextPageError ? (
          // 이어받기가 끊기면 목록이 조용히 멈춘다 — 끝자리에 다시 시도할 자리를 남긴다
          <RetryMessage
            message="더 불러오지 못했어요."
            onRetry={() => {
              void listQuery.fetchNextPage()
            }}
          />
        ) : (
          /* 목록 끝 sentinel — 화면에 들어오면 다음 페이지를 불러온다 */
          <div ref={loadMoreRef} aria-hidden className="h-6 w-full shrink-0" />
        )}
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
            value={activeBook}
            onValueChange={(value) => {
              setSelectedBook(value)
              // 필터를 바꾸면 열어 둔 대상이 화면에서 사라질 수 있어 다이얼로그도 함께 접는다
              release.close()
            }}
            // 시안의 트리거는 140px 고정 폭에 값이 왼쪽, 화살표가 오른쪽 끝이다
            className="w-35 justify-between px-2.5 text-body-14sb"
          />
        </div>

        {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다 */}
        <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">{renderList()}</div>
      </ScreenLayout>

      <SpoilerReleaseDialog
        open={release.target !== null}
        releasing={release.isPending}
        onCancel={release.close}
        onConfirm={release.confirm}
      />

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar tone="light" message={release.errorMessage} onClose={release.clearError} />
    </>
  )
}
