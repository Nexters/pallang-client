'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { TabScreenLayout } from '@/app/_global/_components/TabScreenLayout/TabScreenLayout'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useHardwareBackRegistry } from '@/app/_global/_hooks/useHardwareBackRegistry'
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
  const queryClient = useQueryClient()
  const runWithLogin = useLoginGate()
  const { register } = useHardwareBackRegistry()
  const { status, isAuthenticated } = useAuth()
  const list = useInfiniteQuery({ ...groupQueries.list(), enabled: isAuthenticated })
  const groups = useMemo(
    () => list.data?.pages.flatMap((page) => page.data?.groups ?? []) ?? [],
    [list.data],
  )
  const [moreTarget, setMoreTarget] = useState<GroupSummary | null>(null)
  const [message, setMessage] = useState('')
  const invite = useInviteShare()
  const loadMoreRef = useRef<HTMLLIElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    enabled: list.hasNextPage && !list.isError && !list.isFetchingNextPage,
    onLoadMore: () => {
      void list.fetchNextPage()
    },
  })

  // 만들기/수정 화면이 남긴 표시를 한 번만 꺼내 스낵바로 — set-state-in-effect 린트를 피해 다음 틱에.
  // 꺼내기까지 타이머 안에서 한다 — 밖에서 꺼내면 StrictMode의 첫 이펙트가 표시를 소비하고
  // 그 정리가 타이머를 걷어 가, 두 번째 이펙트에는 꺼낼 것이 없어 문구가 영영 뜨지 않는다.
  useEffect(() => {
    const timer = setTimeout(() => {
      const kind = consumeMeetingNotice()
      if (kind) setMessage(MEETING_NOTICE_MESSAGE[kind])
    }, 0)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const moreGroupId = moreTarget?.groupId ?? null

  // 시트가 열릴 때 초대 링크를 미리 받아 둔다 — 탭 시점에 fetchQuery가 캐시로 끝나야
  // navigator.share가 그 손짓(user activation) 안에서 열린다. 모임장이 아니면 403이 정상이라
  // 여기서는 흘려보내고, 누를 때 문구로 알린다(inviteLink는 retry:false).
  useEffect(() => {
    if (moreGroupId === null) return
    void queryClient.prefetchQuery(groupQueries.inviteLink(moreGroupId))
  }, [moreGroupId, queryClient])

  // 시트가 열려 있는 동안 하드웨어 뒤로가기는 화면을 떠나는 대신 시트만 닫는다(MeetingBookField 선례)
  useEffect(() => {
    if (moreGroupId === null) return
    return register(() => {
      setMoreTarget(null)
    })
  }, [moreGroupId, register])

  const goCreate = () => {
    runWithLogin(() => {
      router.push('/meeting/new')
    }, LOGIN_GATE_MESSAGE.groupCreate)
  }
  const goView = (group: GroupSummary) => {
    router.push(buildTraceHref(group.bookId, { groupId: group.groupId }))
  }
  // 시트를 먼저 닫으면 공유 호출이 사용자 손짓 밖으로 밀려나 OS 공유 시트가 뜨지 않는다 —
  // 연 채로(타일은 isSharing으로 잠긴다) 부르고, 공유가 끝난 뒤에 닫는다.
  const shareInvite = async (group: GroupSummary) => {
    await invite.share(group)
    setMoreTarget(null)
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
          void shareInvite(group)
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
