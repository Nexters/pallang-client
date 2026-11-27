'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { groupQueries } from '@/app/_global/_queries/group.queries'

import { MeetingBookArea } from '../MeetingBookArea/MeetingBookArea'
import { MeetingDetailSkeleton } from '../MeetingDetailSkeleton/MeetingDetailSkeleton'

export function MeetingDetailView({ groupId }: { groupId: number }) {
  const { isAuthenticated, status } = useAuth()
  const router = useRouter()
  const detail = useQuery({ ...groupQueries.detail(groupId), enabled: isAuthenticated })

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/meeting')
  }, [status, router])

  const group = detail.data?.data
  return (
    <ScreenLayout title="모임">
      {detail.isPending ? (
        <MeetingDetailSkeleton />
      ) : detail.isError || !group ? (
        <ApiErrorFeedbackState
          aria-label="모임 정보 오류"
          title="모임 정보를 불러오지 못했어요."
          onRetry={() => {
            void detail.refetch()
          }}
        />
      ) : (
        <section
          aria-label="모임 정보"
          className="flex items-center justify-between gap-2 px-4 py-6"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate font-pretendard text-body-16bd text-text-primary">
              {group.name}
            </h2>
            <p className="font-pretendard text-body-14rg leading-[1.4] text-text-tertiary">
              멤버 {group.memberCount} / {group.capacity}명
            </p>
          </div>
          <button
            type="button"
            aria-disabled="true"
            className="shrink-0 rounded-[17px] bg-black/10 px-2.5 py-2 text-body-14md text-text-primary backdrop-blur-[9px]"
          >
            멤버 보기
          </button>
        </section>
      )}
      <MeetingBookArea groupId={groupId} />
    </ScreenLayout>
  )
}
