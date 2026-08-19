'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { ApiErrorFeedbackState } from '@/app/_global/_components/FeedbackState/FeedbackState'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import {
  type GroupDetail,
  groupMutations,
  groupQueries,
} from '@/app/_global/_queries/group.queries'

import {
  detailToMeetingForm,
  isValidMeetingForm,
  toGroupUpdateInput,
} from '../../_services/meetingForm.service'
import { markMeetingNotice } from '../../_services/meetingNotice.service'
import type { MeetingFormValues } from '../../_types/meetingForm.type'
import { MeetingForm } from '../MeetingForm/MeetingForm'
import { MeetingFormSkeleton } from '../MeetingFormSkeleton/MeetingFormSkeleton'

const FORM_ID = 'meeting-edit-form'

function updateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return '모임장만 수정할 수 있어요.'
    if (error.status === 409) return '현재 참여 인원보다 적게 줄일 수 없어요.'
    if (error.status === 400) return '입력한 정보를 다시 확인해주세요.'
  }
  return '모임을 수정하지 못했어요. 잠시 후 다시 시도해주세요.'
}

type MeetingEditViewProps = { groupId: number }

export function MeetingEditView({ groupId }: MeetingEditViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const runWithLogin = useLoginGate()
  const { status, isAuthenticated } = useAuth()
  const detail = useQuery({ ...groupQueries.detail(groupId), enabled: isAuthenticated })
  // 사용자가 고친 값. null이면 아직 손대지 않은 것 — 상세 응답을 그대로 편 값을 보여준다(effect로 복사하지 않는다).
  const [edited, setEdited] = useState<MeetingFormValues | null>(null)
  const [message, setMessage] = useState('')
  const update = useMutation(groupMutations.update(groupId))

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/meeting')
  }, [status, router])

  const loaded: GroupDetail | undefined = detail.data?.data
  const values = edited ?? (loaded ? detailToMeetingForm(loaded) : null)
  const memberCount = loaded?.memberCount ?? 0
  const canSubmit = values !== null && isValidMeetingForm(values, memberCount)

  const submit = () => {
    if (!values || !canSubmit) return
    update.mutate(toGroupUpdateInput(values), {
      onSuccess: () => {
        markMeetingNotice('updated')
        // 옛 목록을 남겨 두면 /meeting이 수정 전 값으로 먼저 그려진다 — 지우고 떠나 골격부터 시작한다
        queryClient.removeQueries({ queryKey: groupQueries.list().queryKey })
        // 나머지 갱신은 이동을 막을 이유가 없다 — 뒤에서 마저 돈다
        void queryClient.invalidateQueries({ queryKey: groupQueries.all() })
        router.replace('/meeting')
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          runWithLogin(submit, LOGIN_GATE_MESSAGE.groupEdit)
          return
        }
        setMessage(updateErrorMessage(error))
      },
    })
  }

  const renderBody = () => {
    if (detail.isError) {
      return (
        <ApiErrorFeedbackState
          aria-label="모임 정보 오류"
          title="모임 정보를 불러오지 못했어요."
          onRetry={() => {
            void detail.refetch()
          }}
        />
      )
    }
    if (!values) return <MeetingFormSkeleton />
    return (
      <MeetingForm
        formId={FORM_ID}
        values={values}
        onChange={setEdited}
        onSubmit={submit}
        bookLocked
        minCapacity={memberCount}
      />
    )
  }

  return (
    <>
      <ScreenLayout
        title="방 설정 변경"
        bodyClassName="px-4 pt-4 pb-6"
        footer={
          <Button
            type="submit"
            form={FORM_ID}
            variant="activated"
            className="h-[54px] flex-1 disabled:bg-interactive-accent disabled:opacity-40 aria-busy:opacity-100"
            disabled={!canSubmit}
            loading={update.isPending}
          >
            수정하기
          </Button>
        }
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
