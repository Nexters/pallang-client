'use client'

import { useId, useState } from 'react'

import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'

import { formatMeetingPeriod, isValidMeetingPeriod } from '../../_services/meetingDate.service'
import { MeetingField } from '../MeetingField/MeetingField'
import { type MeetingPeriod, MeetingPeriodSheet } from '../MeetingPeriodSheet/MeetingPeriodSheet'

type MeetingPeriodFieldProps = {
  startDate: string
  endDate: string
  onChange: (period: MeetingPeriod) => void
}

/** 시안 3321:28135 — 343×56 surface r16 p16, 플레이스홀더 16md 50%, 우측 › Icon/Muted. 탭 → 기간 시트 */
export function MeetingPeriodField({ startDate, endDate, onChange }: MeetingPeriodFieldProps) {
  const labelId = useId()
  const textId = useId()
  const [open, setOpen] = useState(false)
  const hasPeriod = isValidMeetingPeriod(startDate, endDate)

  return (
    <MeetingField label="기간" required labelId={labelId}>
      <button
        type="button"
        aria-labelledby={`${labelId} ${textId}`}
        onClick={() => {
          setOpen(true)
        }}
        className="press flex h-14 w-full items-center gap-2 rounded-2xl bg-bg-surface p-4 text-left"
      >
        <span
          id={textId}
          className={
            hasPeriod
              ? 'flex-1 truncate text-body-16md text-text-primary'
              : 'flex-1 truncate text-body-16md text-text-placeholder-a50'
          }
        >
          {hasPeriod ? formatMeetingPeriod(startDate, endDate) : '시작일과 종료일을 선택해주세요.'}
        </span>
        <NextIcon className="size-6 shrink-0 text-icon-muted" />
      </button>
      <MeetingPeriodSheet
        open={open}
        startDate={startDate}
        endDate={endDate}
        onClose={() => {
          setOpen(false)
        }}
        onConfirm={(period) => {
          onChange(period)
          setOpen(false)
        }}
      />
    </MeetingField>
  )
}
