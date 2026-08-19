'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupQueries, type GroupSummary } from '@/app/_global/_queries/group.queries'
import { buildTraceHref } from '@/app/_shared/trace/_data/traceTarget.model'

import { MEETING_NOTICE_MESSAGE } from '../../_data/meeting.constant'
import { useInviteShare } from '../../_hooks/useInviteShare'
import { consumeMeetingNotice } from '../../_services/meetingNotice.service'
import { MeetingEmptyState } from '../MeetingEmptyState/MeetingEmptyState'
import { MeetingList } from '../MeetingList/MeetingList'
import { MeetingListSkeleton } from '../MeetingListSkeleton/MeetingListSkeleton'
import { MeetingMoreSheet } from '../MeetingMoreSheet/MeetingMoreSheet'

export function MeetingPageView() {
  const router = useRouter()
  const runWithLogin = useLoginGate()
  const { status, isAuthenticated } = useAuth()
  const list = useInfiniteQuery({ ...groupQueries.list(), enabled: isAuthenticated })
  const groups = useMemo(
    () => list.data?.pages.flatMap((page) => page.data?.groups ?? []) ?? [],
    [list.data],
  )
  const [moreTarget, setMoreTarget] = useState<GroupSummary | null>(null)
  const [message, setMessage] = useState('')
  const invite = useInviteShare()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: list.hasNextPage && !list.isError && !list.isFetchingNextPage,
    onLoadMore: () => {
      void list.fetchNextPage()
    },
  })

  // 만들기/수정 화면이 남긴 표시를 한 번만 꺼내 스낵바로 — set-state-in-effect 린트를 피해 다음 틱에
  useEffect(() => {
    const kind = consumeMeetingNotice()
    if (!kind) return
    const timer = setTimeout(() => {
      setMessage(MEETING_NOTICE_MESSAGE[kind])
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const goCreate = () => {
    runWithLogin(() => {
      router.push('/meeting/new')
    }, LOGIN_GATE_MESSAGE.groupCreate)
  }
  const goView = (group: GroupSummary) => {
    router.push(buildTraceHref(group.bookId, { groupId: group.groupId }))
  }

  const isPending = status === 'loading' || (isAuthenticated && list.isPending)
  const isEmpty =
    status === 'unauthenticated' || (!list.isPending && groups.length === 0 && !list.isError)

  const renderBody = () => {
    if (isPending) return <MeetingListSkeleton />
    if (list.isError && groups.length === 0) {
      return (
        <ApiErrorFeedbackState
          aria-label="모임 목록 오류"
          title="모임을 불러오지 못했어요."
          onRetry={() => {
            void list.refetch()
          }}
        />
      )
    }
    if (isEmpty) return <MeetingEmptyState onCreate={goCreate} />
    return (
      <MeetingList
        groups={groups}
        onMore={setMoreTarget}
        onView={goView}
        loadMoreRef={loadMoreRef}
      />
    )
  }

  return (
    <>
      <TabScreenLayout
        activeTab="meeting"
        aria-label="모임"
        className="flex flex-col overflow-y-auto bg-bg-surface"
      >
        <TopBar.Root>
          <TopBar.Title as="h1">모임</TopBar.Title>
          <TopBar.Spacer />
          {groups.length > 0 && (
            <TopBar.Action aria-label="새 모임 만들기" onClick={goCreate}>
              <PlusIcon />
            </TopBar.Action>
          )}
        </TopBar.Root>
        {renderBody()}
      </TabScreenLayout>
      <MeetingMoreSheet
        group={moreTarget}
        isSharing={invite.isSharing}
        onClose={() => {
          setMoreTarget(null)
        }}
        onShareInvite={(group) => {
          setMoreTarget(null)
          void invite.share(group)
        }}
        onEditSettings={(group) => {
          setMoreTarget(null)
          router.push(`/meeting/${String(group.groupId)}/edit`)
        }}
      />
      <Snackbar
        tone="light"
        message={message || invite.message}
        onClose={() => {
          setMessage('')
          invite.closeMessage()
        }}
      />
    </>
  )
}
