'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import {
  ApiErrorFeedbackState,
  FeedbackState,
} from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupMutations, groupQueries } from '@/app/_global/_queries/group.queries'
import {
  clearPostLoginReturnPath,
  markPostLoginReturnPath,
} from '@/app/_global/_services/postLoginRedirect.service'

import { GROUP_JOIN_ALREADY_CODE, GROUP_JOIN_FULL_CODE } from '../../_data/meeting.constant'
import { markMeetingNotice } from '../../_services/meetingNotice.service'
import { MeetingInviteSkeleton } from '../MeetingInviteSkeleton/MeetingInviteSkeleton'

const MEETING_PATH = '/meeting'
const INVALID_INVITE_MESSAGE = '유효하지 않은 초대 링크예요.'
const FULL_MESSAGE = '정원이 가득 차 참여할 수 없어요.'

/** 서버 사유 → 사용자 문구. 401(게이트)·409 이미 가입(이동)은 호출부가 먼저 가로챈다. */
function joinErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return INVALID_INVITE_MESSAGE
    if (error.code === GROUP_JOIN_FULL_CODE) return FULL_MESSAGE
  }
  return '모임에 참여하지 못했어요. 잠시 후 다시 시도해주세요.'
}

type MeetingInviteViewProps = { inviteCode: string }

/** 공유받은 초대 링크의 랜딩 — 가입 전 모임을 보여주고 참여시킨다 */
export function MeetingInviteView({ inviteCode }: MeetingInviteViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const runWithLogin = useLoginGate()
  // 미리보기는 인증이 선택이라 enabled로 막지 않는다 — 비로그인도 모임을 볼 수 있어야 초대가 초대다
  const preview = useQuery(groupQueries.invitationPreview(inviteCode))
  const [message, setMessage] = useState('')
  const join = useMutation(groupMutations.join())

  const invitation = preview.data?.data
  const isInvalidInvite = preview.error instanceof ApiError && preview.error.status === 404

  const goMeeting = () => {
    router.replace(MEETING_PATH)
  }

  const sendJoin = () => {
    join.mutate(inviteCode, {
      onSuccess: () => {
        markMeetingNotice('joined')
        // 옛 목록을 남겨 두면 /meeting이 방금 참여한 모임이 빠진 캐시로 먼저 그려진다
        queryClient.removeQueries({ queryKey: groupQueries.list().queryKey })
        // 나머지 갱신은 이동을 막을 이유가 없다 — 뒤에서 마저 돈다(만들기·수정 선례)
        void queryClient.invalidateQueries({ queryKey: groupQueries.all() })
        goMeeting()
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            joinMeeting()
            return
          }
          // 이미 멤버면 실패가 아니라 이미 도착한 것이다 — 참여 알림만 빼고 목록으로 보낸다
          if (error.code === GROUP_JOIN_ALREADY_CODE) {
            goMeeting()
            return
          }
          if (error.code === GROUP_JOIN_FULL_CODE) {
            setMessage(FULL_MESSAGE)
            // 마지막 자리가 방금 찼다 — 표시를 최신으로 바꿔 CTA까지 잠근다
            void preview.refetch()
            return
          }
        }
        setMessage(joinErrorMessage(error))
      },
    })
  }

  const joinMeeting = () => {
    // 게이트에 막히면 로그인 화면으로 떠난다 — 돌아올 자리를 먼저 심어야 로그인 뒤 이 초대로 복귀한다
    markPostLoginReturnPath(`/meeting/invite/${encodeURIComponent(inviteCode)}`)
    const started = runWithLogin(sendJoin, LOGIN_GATE_MESSAGE.groupJoin)
    // 로그인 상태라 바로 실행됐다면 복귀 자리는 쓸 일이 없다 — 남겨 두면 다음 로그인이 여기로 끌려온다
    if (started) clearPostLoginReturnPath()
  }

  const renderBody = () => {
    if (isInvalidInvite) {
      return (
        <FeedbackState
          aria-label="유효하지 않은 초대"
          message={INVALID_INVITE_MESSAGE}
          actionLabel="모임 탭으로 가기"
          onAction={goMeeting}
        />
      )
    }
    if (preview.isError) {
      return (
        <ApiErrorFeedbackState
          aria-label="초대 정보 오류"
          title="초대 정보를 불러오지 못했어요."
          onRetry={() => {
            void preview.refetch()
          }}
        />
      )
    }
    if (!invitation) return <MeetingInviteSkeleton />
    return (
      <section
        aria-label={invitation.name}
        className="flex flex-1 flex-col items-center justify-center gap-4"
      >
        <div
          aria-hidden="true"
          className="h-18 w-12 shrink-0 rounded-md bg-bg-surface bg-cover bg-center"
          style={
            invitation.bookCoverImageUrl
              ? { backgroundImage: `url(${invitation.bookCoverImageUrl})` }
              : undefined
          }
        />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-center text-title-20bd text-text-primary">{invitation.name}</h2>
          <p className="text-center text-caption-12rg text-text-tertiary">
            {invitation.bookTitle} · {invitation.bookAuthor}
          </p>
        </div>
        <p className="text-body-14md text-text-tertiary">
          참여 인원 {invitation.memberCount}/{invitation.capacity}명
        </p>
        {invitation.full && <p className="text-body-14md text-text-accent">{FULL_MESSAGE}</p>}
      </section>
    )
  }

  // 에러 화면은 제 몫의 행동(다시 시도하기·모임 탭으로 가기)을 이미 들고 있다 — CTA를 겹쳐 세우지 않는다
  const renderFooter = () => {
    if (preview.isError) return undefined
    if (!invitation) return <Skeleton className="h-[54px] flex-1 rounded-2xl" />
    if (invitation.alreadyJoined) {
      return (
        <Button variant="activated" className="h-[54px] flex-1" onClick={goMeeting}>
          모임 탭으로 가기
        </Button>
      )
    }
    if (invitation.full) {
      return (
        <Button
          variant="activated"
          className="h-[54px] flex-1 disabled:bg-interactive-accent disabled:opacity-40"
          disabled
        >
          모임 참여하기
        </Button>
      )
    }
    return (
      <Button
        variant="activated"
        className="h-[54px] flex-1"
        loading={join.isPending}
        onClick={joinMeeting}
      >
        모임 참여하기
      </Button>
    )
  }

  return (
    <>
      <ScreenLayout
        title="모임 초대"
        bodyClassName="px-4 py-6"
        // 초대는 외부 앱·새 탭에서 바로 열려 돌아갈 곳이 없을 수 있다 — 그때는 모임 탭으로 보낸다
        onBack={() => {
          if (window.history.length <= 1) {
            router.replace(MEETING_PATH)
            return
          }
          router.back()
        }}
        footer={renderFooter()}
      >
        {renderBody()}
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
