'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { groupMutations, groupQueries } from '@/app/_global/_queries/group.queries'

import {
  emptyMeetingForm,
  isValidMeetingForm,
  toGroupCreateInput,
} from '../../_services/meetingForm.service'
import { markMeetingNotice } from '../../_services/meetingNotice.service'
import type { MeetingFormValues } from '../../_types/meetingForm.type'
import { MeetingForm } from '../MeetingForm/MeetingForm'

const FORM_ID = 'meeting-create-form'

/** 서버 사유 → 사용자 문구. 401은 게이트가 받는다. */
function createErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return '선택한 책을 찾을 수 없어요.'
    if (error.status === 400) return '입력한 정보를 다시 확인해주세요.'
  }
  return '모임을 만들지 못했어요. 잠시 후 다시 시도해주세요.'
}

export function MeetingCreateView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const runWithLogin = useLoginGate()
  const { status } = useAuth()
  const [values, setValues] = useState<MeetingFormValues>(emptyMeetingForm)
  const [message, setMessage] = useState('')
  const create = useMutation(groupMutations.create())

  // 진입은 게이트를 지나지만 URL로 바로 오면 비로그인일 수 있다 — 목록으로 되돌린다(프로필 설정 선례)
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/meeting')
  }, [status, router])

  const submit = () => {
    if (!values.book || !isValidMeetingForm(values)) return
    const input = toGroupCreateInput({ ...values, book: values.book })
    create.mutate(input, {
      onSuccess: () => {
        markMeetingNotice('created')
        // 옛 목록을 남겨 두면 /meeting이 방금 만든 모임이 빠진 캐시로 먼저 그려진다 — 지우고 떠나 골격부터 시작한다
        queryClient.removeQueries({ queryKey: groupQueries.list().queryKey })
        // 나머지 갱신은 이동을 막을 이유가 없다 — 뒤에서 마저 돈다(프로필 설정 선례)
        void queryClient.invalidateQueries({ queryKey: groupQueries.all() })
        router.replace('/meeting')
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          runWithLogin(submit, LOGIN_GATE_MESSAGE.groupCreate)
          return
        }
        setMessage(createErrorMessage(error))
      },
    })
  }

  return (
    <>
      <ScreenLayout
        title="모임 만들기"
        bodyClassName="px-4 pt-4 pb-6"
        footer={
          <Button
            type="submit"
            form={FORM_ID}
            variant="activated"
            className="h-[54px] flex-1 disabled:bg-interactive-accent disabled:opacity-40 aria-busy:opacity-100"
            disabled={!isValidMeetingForm(values)}
            loading={create.isPending}
          >
            모임 만들기
          </Button>
        }
      >
        <MeetingForm formId={FORM_ID} values={values} onChange={setValues} onSubmit={submit} />
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
