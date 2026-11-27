'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { type GroupBook, groupMutations, groupQueries } from '@/app/_global/_queries/group.queries'
import { SelectedBookCard } from '@/app/_shared/book/_components/SelectedBookCard/SelectedBookCard'

import { MeetingField } from '../MeetingField/MeetingField'
import { MeetingFormSkeleton } from '../MeetingFormSkeleton/MeetingFormSkeleton'
import { MeetingPeriodField } from '../MeetingPeriodField/MeetingPeriodField'

function BookFields({ book, groupId }: { book: GroupBook; groupId: number }) {
  const [period, setPeriod] = useState({
    startDate: book.startDate ?? '',
    endDate: book.endDate ?? '',
  })
  const [status, setStatus] = useState<'READING' | 'FINISHED'>(book.status)
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const update = useMutation(groupMutations.updateBook(groupId, book.entryId))
  const submit = () => {
    update.mutate(
      {
        startDate: period.startDate || null,
        endDate: period.endDate || null,
        ...(status !== book.status ? { status } : {}),
      },
      {
        onSuccess: () => {
          setMessage('책 상태가 변경되었습니다.')
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: [...groupQueries.all(), 'books', groupId] }),
            queryClient.invalidateQueries({
              queryKey: groupQueries.book(groupId, book.entryId).queryKey,
            }),
            queryClient.invalidateQueries({ queryKey: groupQueries.list().queryKey }),
          ])
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'GROUP_400_5') {
            setMessage('변경하는 날짜는 오늘부터 선택해주세요.')
          } else {
            setMessage('책 설정을 변경하지 못했어요. 다시 시도해주세요.')
          }
        },
      },
    )
  }
  return (
    <>
      <ScreenLayout
        title="책 설정 변경"
        bodyClassName="px-4 pt-4 pb-6"
        footer={
          <Button
            variant="activated"
            className="h-[54px] flex-1"
            loading={update.isPending}
            onClick={submit}
          >
            수정하기
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <MeetingField label="책 선택" required helperText="선택한 책은 변경할 수 없어요.">
            <SelectedBookCard
              book={{
                bookId: book.bookId,
                title: book.title,
                author: book.author,
                coverImageUrl: book.coverImageUrl ?? null,
                pageCount: null,
              }}
            />
          </MeetingField>
          <MeetingPeriodField
            startDate={period.startDate}
            endDate={period.endDate}
            onChange={setPeriod}
            optional
            originalDates={{ startDate: book.startDate ?? '', endDate: book.endDate ?? '' }}
          />
          <MeetingField label="독서 상태">
            <SegmentedControl
              label="독서 상태"
              variant="light"
              value={status}
              onChange={(value) => {
                if (value === 'READING' || value === 'FINISHED') setStatus(value)
              }}
              options={[
                { value: 'READING', label: '읽는 중' },
                { value: 'FINISHED', label: '완독' },
              ]}
            />
          </MeetingField>
        </div>
      </ScreenLayout>
      <Snackbar
        tone="light"
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </>
  )
}

export function MeetingBookEditView({ groupId, entryId }: { groupId: number; entryId: number }) {
  const { isAuthenticated, status } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/meeting')
  }, [status, router])
  const book = useQuery({ ...groupQueries.book(groupId, entryId), enabled: isAuthenticated })
  if (book.data) return <BookFields key={book.data.entryId} book={book.data} groupId={groupId} />
  return (
    <ScreenLayout title="책 설정 변경" bodyClassName="px-4 pt-4 pb-6">
      {book.isPending ? (
        <MeetingFormSkeleton />
      ) : (
        <ApiErrorFeedbackState
          aria-label="책 정보 오류"
          title="책 정보를 불러오지 못했어요."
          onRetry={() => {
            void book.refetch()
          }}
        />
      )}
    </ScreenLayout>
  )
}
