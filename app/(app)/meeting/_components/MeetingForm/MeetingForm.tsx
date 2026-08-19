'use client'

import { useId } from 'react'

import { MEETING_NAME_MAX_LENGTH } from '../../_data/meeting.constant'
import type { MeetingFormValues } from '../../_types/meetingForm.type'
import { MeetingBookField } from '../MeetingBookField/MeetingBookField'
import { MeetingCapacityField } from '../MeetingCapacityField/MeetingCapacityField'
import { MeetingField } from '../MeetingField/MeetingField'
import { MeetingPeriodField } from '../MeetingPeriodField/MeetingPeriodField'

type MeetingFormProps = {
  /** 제출 버튼이 폼 밖(ScreenLayout footer)에 있어 form 속성으로 잇는다 */
  formId: string
  values: MeetingFormValues
  onChange: (values: MeetingFormValues) => void
  onSubmit: () => void
  bookLocked?: boolean
  minCapacity?: number
}

/** 시안 3319:25486 — 필드 4개 세로 24px 간격. 만들기·수정이 같은 폼이고 차이는 책 잠금·인원 하한뿐이다. */
export function MeetingForm({
  formId,
  values,
  onChange,
  onSubmit,
  bookLocked = false,
  minCapacity,
}: MeetingFormProps) {
  const nameId = useId()
  const update = (patch: Partial<MeetingFormValues>) => {
    onChange({ ...values, ...patch })
  }

  return (
    <form
      id={formId}
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <MeetingField label="모임명" required helperText="최대 15자까지 가능해요." htmlFor={nameId}>
        <input
          id={nameId}
          value={values.name}
          maxLength={MEETING_NAME_MAX_LENGTH}
          placeholder="모임명을 입력해주세요"
          autoComplete="off"
          className="h-14 w-full rounded-2xl bg-bg-surface p-4 text-body-16md text-text-primary outline-none placeholder:text-text-placeholder-a50"
          onChange={(event) => {
            update({ name: event.target.value })
          }}
        />
      </MeetingField>
      <MeetingCapacityField
        value={values.capacity}
        minCapacity={minCapacity}
        onChange={(capacity) => {
          update({ capacity })
        }}
      />
      <MeetingBookField
        value={values.book}
        locked={bookLocked}
        onChange={(book) => {
          update({ book })
        }}
      />
      <MeetingPeriodField
        startDate={values.startDate}
        endDate={values.endDate}
        onChange={(period) => {
          update(period)
        }}
      />
    </form>
  )
}
