'use client'

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingBookItem } from '../MeetingBookItem/MeetingBookItem'

export function MeetingBookArea({ groupId }: { groupId?: number }) {
  const [selected, setSelected] = useState<'READING' | 'FINISHED' | undefined>()
  const { isAuthenticated } = useAuth()
  const books = useInfiniteQuery({
    ...groupQueries.bookTabs(groupId ?? 0, selected),
    enabled: groupId !== undefined && isAuthenticated,
    placeholderData: keepPreviousData,
  })
  const data = books.data?.pages[0]?.data
  const items = books.isPlaceholderData
    ? []
    : (books.data?.pages.flatMap((page) => page.data?.books ?? []) ?? [])
  const loadMoreRef = useRef<HTMLLIElement>(null)
  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: books.hasNextPage && !books.isFetching && !books.isError && !books.isPlaceholderData,
    onLoadMore: () => {
      void books.fetchNextPage()
    },
  })
  return (
    <div className="flex flex-1 flex-col bg-bg-surface px-4 pt-4 pb-safe">
      {data ? (
        <SegmentedControl
          label="모임 책 상태"
          variant="book-tabs"
          value={selected ?? data.status}
          onChange={(value) => {
            if (value === 'READING' || value === 'FINISHED') setSelected(value)
          }}
          options={[
            { value: 'READING', label: `함께 읽는 책 ${String(data.readingCount)}` },
            { value: 'FINISHED', label: `완독한 책 ${String(data.finishedCount)}` },
          ]}
        />
      ) : books.isError ? (
        <button
          type="button"
          className="press self-start text-body-14md text-text-secondary"
          onClick={() => {
            void books.refetch()
          }}
        >
          책 정보를 불러오지 못했어요. 다시 시도하기
        </button>
      ) : (
        <div role="status" aria-label="책 정보를 불러오는 중" className="self-center">
          <Skeleton className="h-10 w-56 rounded-full bg-bg-default" />
        </div>
      )}
      {books.isPlaceholderData && (
        <div role="status" aria-label="책 목록을 불러오는 중" className="mt-4">
          <Skeleton className="h-[104px] w-full rounded-2xl bg-bg-default" />
        </div>
      )}
      {items.length > 0 && (
        <ul aria-label="모임 책 목록" className="mt-4 flex flex-col gap-3">
          {items.map((book) => (
            <li key={book.entryId}>
              <MeetingBookItem book={book} />
            </li>
          ))}
          <li ref={loadMoreRef} aria-hidden="true" />
        </ul>
      )}
      {books.isFetchNextPageError && (
        <button
          type="button"
          className="press mt-2 self-start text-body-14md text-text-secondary"
          onClick={() => {
            void books.fetchNextPage()
          }}
        >
          책을 더 불러오지 못했어요. 다시 시도하기
        </button>
      )}
      <div className="flex-1" />
      <Button variant="activated" aria-disabled="true" className="w-full">
        + 함께 읽을 책 추가
      </Button>
    </div>
  )
}
