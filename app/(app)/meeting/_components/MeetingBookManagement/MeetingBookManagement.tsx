'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingBookItem } from '../MeetingBookItem/MeetingBookItem'

export function MeetingBookManagement({ groupId }: { groupId: number }) {
  const books = useInfiniteQuery(groupQueries.books(groupId))
  const items = books.data?.pages.flatMap((page) => page.data?.books ?? []) ?? []

  return (
    <section aria-label="책 관리" className="-mx-4 flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="flex items-start gap-0.5 px-4 text-body-14md text-text-secondary">
        책 관리
        <span aria-hidden className="font-bold text-interactive-required">
          *
        </span>
      </h2>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto bg-bg-surface p-4 pb-[calc(86px+max(16px,var(--safe-bottom)))]">
        {books.isPending && (
          <div role="status" aria-label="책 목록을 불러오는 중" className="flex flex-col gap-2">
            <Skeleton className="h-[152px] w-full bg-bg-default" />
            <Skeleton className="h-[152px] w-full bg-bg-default" />
          </div>
        )}
        {items.map((book) => (
          <MeetingBookItem key={book.entryId} book={book} />
        ))}
        {books.isError && (
          <button
            type="button"
            className="press text-body-14md text-text-secondary"
            onClick={() => {
              void books.refetch()
            }}
          >
            책 목록을 불러오지 못했어요. 다시 시도하기
          </button>
        )}
        {!books.isPending && !books.isError && items.length === 0 && (
          <p className="text-body-14md text-text-secondary">등록된 책이 없어요.</p>
        )}
        {books.hasNextPage && (
          <button
            type="button"
            disabled={books.isFetchingNextPage}
            className="press text-body-14md text-text-secondary"
            onClick={() => {
              void books.fetchNextPage()
            }}
          >
            {books.isFetchingNextPage ? '불러오는 중' : '더 보기'}
          </button>
        )}
      </div>
    </section>
  )
}
