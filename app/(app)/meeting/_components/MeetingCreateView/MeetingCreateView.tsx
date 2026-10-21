'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { ApiError } from '@/app/_global/_data/api.model'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useAuth } from '@/app/_global/_providers/AuthProvider/AuthProvider'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { groupMutations, groupQueries } from '@/app/_global/_queries/group.queries'

import {
  isValidMeetingForm,
  seedMeetingForm,
  toGroupCreateInput,
} from '../../_services/meetingForm.service'
import { markMeetingNotice } from '../../_services/meetingNotice.service'
import type { MeetingFormValues } from '../../_types/meetingForm.type'
import { MeetingForm } from '../MeetingForm/MeetingForm'
import { MeetingFormSkeleton } from '../MeetingFormSkeleton/MeetingFormSkeleton'

const FORM_ID = 'meeting-create-form'

/** 서버 사유 → 사용자 문구. 401은 게이트가 받는다. */
function createErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return '선택한 책을 찾을 수 없어요.'
    if (error.status === 400) return '입력한 정보를 다시 확인해주세요.'
  }
  return '모임을 만들지 못했어요. 잠시 후 다시 시도해주세요.'
}

type MeetingCreateViewProps = {
  /** 책 목록의 안내 모달('새 모임 개설하기')에서 왔으면 보던 책 — 책 칸을 그 책으로 채운 채 연다 */
  seedBookId?: number | null
}

export function MeetingCreateView({ seedBookId = null }: MeetingCreateViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const runWithLogin = useLoginGate()
  const { status } = useAuth()
  const seedBook = useQuery({
    ...bookQueries.detail(seedBookId ?? 0),
    enabled: seedBookId !== null,
  })
  // 사용자가 고친 값. null이면 아직 손대지 않은 것 — 받아 온 책을 채운 폼을 그대로 보여준다(effect로 복사하지 않는다)
  const [edited, setEdited] = useState<MeetingFormValues | null>(null)
  const values = edited ?? seedMeetingForm(seedBook.data?.data)
  // 책을 받기 전에 폼을 열면 그사이 입력한 값이 책 없는 폼으로 굳는다 — 받을 때까지 골격으로 둔다.
  // 받지 못하면(지운 책 등) 빈 폼으로 열어 직접 고르게 한다
  const isSeedPending = seedBookId !== null && seedBook.isPending
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
        {isSeedPending ? (
          <MeetingFormSkeleton />
        ) : (
          <MeetingForm formId={FORM_ID} values={values} onChange={setEdited} onSubmit={submit} />
        )}
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
