'use client'

import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Select } from '@/app/_global/_components/Select/Select'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { type LikedOpinion, userQueries } from '@/app/_global/_queries/user.queries'
import { LikedOpinionCard } from '@/app/_shared/user/_components/LikedOpinionCard/LikedOpinionCard'
import { RecordPanel } from '@/app/_shared/user/_components/RecordPanel/RecordPanel'

/** 책을 고르지 않은 상태. Select는 문자열 값만 다뤄 숫자 bookId와 섞이지 않을 이름을 쓴다. */
const ALL_BOOKS = 'all'

/** 좋아요를 되돌릴 대상 — 스낵바가 닫히거나 필터가 바뀌면 비운다 */
type UnlikedTarget = { opinionId: number; nickname: string; undo: () => void }

export function LikedOpinionsView() {
  const queryClient = useQueryClient()
  const [pickedBook, setPickedBook] = useState<string>(ALL_BOOKS)
  const [unliked, setUnliked] = useState<UnlikedTarget | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  /** 아직 확정하지 않은 해제가 있는지 — 화면을 벗어날 때도 봐야 해서 state가 아니라 ref다 */
  const hasPendingUnlike = useRef(false)

  const booksQuery = useQuery(userQueries.filterBooks('LIKE'))

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

  // 그 책의 좋아요를 전부 해제하면 책이 필터 목록에서 빠진다. 고른 값이 사라진 채로 두면
  // Select가 제목 대신 bookId를 그대로 그리고, 목록도 그 책에 묶인 채 비어 보인다.
  // 고른 값을 되돌려 쓰지 않고 파생값만 쓴다 — effect로 setState하면 연쇄 렌더가 된다.
  // 앱 안에서 책이 빠지는 경로만 있고 다시 붙는 경로는 없어, 되돌릴 필요도 없다.
  const selectedBook = bookOptions.some((option) => option.value === pickedBook)
    ? pickedBook
    : ALL_BOOKS

  const bookId = selectedBook === ALL_BOOKS ? undefined : Number(selectedBook)
  const listQuery = useInfiniteQuery({
    ...userQueries.likedOpinionList(bookId),
    // 책을 바꿀 때마다 새 캐시 엔트리라 목록 전체가 골격으로 번쩍인다 — 이전 목록을 유지한다
    placeholderData: keepPreviousData,
  })

  const opinions = useMemo<LikedOpinion[]>(
    () => listQuery.data?.pages.flatMap((page) => page.data?.opinions ?? []) ?? [],
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

  /** 해제한 목록과 도서 필터를 다시 받는다 — 마지막 좋아요였으면 그 책이 필터에서도 빠져야 한다 */
  const invalidateLikeLists = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: userQueries.likedOpinionListAll() })
    void queryClient.invalidateQueries({ queryKey: userQueries.filterBooks('LIKE').queryKey })
  }, [queryClient])

  // 되돌릴 창이 열린 채로 화면을 벗어나도 해제는 확정이다. 여기서 무효화해 두지 않으면
  // 다음 진입이 60초 캐시를 그대로 읽어, 해제한 카드가 하트만 꺼진 채 남는다.
  useEffect(
    () => () => {
      if (hasPendingUnlike.current) invalidateLikeLists()
    },
    [invalidateLikeLists],
  )

  /** 되돌릴 수 있는 창을 연다. 앞선 해제가 아직 열려 있으면 그건 확정으로 넘긴다 */
  function startUndoWindow(target: UnlikedTarget) {
    if (hasPendingUnlike.current) invalidateLikeLists()
    hasPendingUnlike.current = true
    setUnliked(target)
  }

  /** 되돌릴 수 있는 창이 끝나는 자리 — `취소`로 되돌렸을 때는 부르지 않는다 */
  function commitUnlike() {
    hasPendingUnlike.current = false
    setUnliked(null)
    invalidateLikeLists()
  }

  /** 되돌렸을 때. 좋아요가 제자리로 돌아왔으니 목록을 흔들지 않는다 */
  function cancelUndoWindow() {
    hasPendingUnlike.current = false
    setUnliked(null)
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
              setPickedBook(value)
              // 필터를 바꾸면 되돌릴 카드가 화면에서 사라진다 — 안내를 접고 해제를 확정한다
              if (unliked) commitUnlike()
            }}
            // 시안의 트리거는 140px 고정 폭에 값이 왼쪽, 화살표가 오른쪽 끝이다
            className="w-35 justify-between px-2.5 text-body-14sb"
          />
        </div>

        {/* 카드가 흰색이라 목록 면은 회색이어야 카드가 떠 보인다 */}
        <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">
          <RecordPanel
            label="좋아요 관리"
            emptyMessage="등록한 좋아요가 없습니다"
            isPending={listQuery.isPending}
            isError={listQuery.isError}
            isEmpty={opinions.length === 0}
            isFetching={listQuery.isFetching}
            hasNextPage={listQuery.hasNextPage}
            isFetchNextPageError={listQuery.isFetchNextPageError}
            isFetchingNextPage={listQuery.isFetchingNextPage}
            onRetry={() => {
              void listQuery.refetch()
            }}
            onRetryNextPage={() => {
              void listQuery.fetchNextPage()
            }}
            loadMoreRef={loadMoreRef}
          >
            {opinions.map((opinion) => (
              <li key={opinion.opinionId}>
                <LikedOpinionCard
                  opinion={opinion}
                  onUnlike={startUndoWindow}
                  onRelike={(opinionId) => {
                    // 직접 다시 켰으면 되돌릴 것이 없다 — 그 카드의 안내만 걷는다
                    if (unliked?.opinionId === opinionId) cancelUndoWindow()
                  }}
                />
              </li>
            ))}
          </RecordPanel>
        </div>
      </ScreenLayout>

      {/* absolute라 스크롤 컨테이너 안에 두면 함께 밀린다 — 셸 밖에 세운다 */}
      <Snackbar
        tone="light"
        message={unliked ? `${unliked.nickname}님의 좋아요를 해제했어요` : ''}
        // 닉네임이 같은 카드를 연달아 해제하면 문구가 그대로라 타이머가 리셋되지 않는다
        messageKey={unliked?.opinionId}
        actionLabel="취소"
        onAction={() => {
          unliked?.undo()
          cancelUndoWindow()
        }}
        onClose={commitUnlike}
      />
    </>
  )
}
