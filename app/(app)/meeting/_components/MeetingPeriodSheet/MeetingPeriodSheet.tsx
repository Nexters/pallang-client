'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { useAppBack } from '@/app/_global/_hooks/useAppBack'
import { cn } from '@/app/_global/_services/cn.service'

import {
  buildMonthGrid,
  formatDateDots,
  isValidMeetingPeriod,
  pickRangeDate,
  toIsoDate,
} from '../../_services/meetingDate.service'

export type MeetingPeriod = { startDate: string; endDate: string }

type MeetingPeriodSheetProps = {
  open: boolean
  startDate: string
  endDate: string
  onClose: () => void
  onConfirm: (period: MeetingPeriod) => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 열 때 보여줄 달 — 시작일이 있으면 그 달, 없으면 이번 달 */
function initialMonth(startDate: string): Date {
  const base = startDate ? new Date(startDate) : new Date()
  return new Date(base.getFullYear(), base.getMonth(), 1)
}

/**
 * 기간 피커 — 시안이 없어 달력 한 달짜리 범위 선택으로 만든다(두 번 탭 = 시작·종료).
 * 종료 < 시작은 서버가 GROUP_400_1로 거절하므로 탭 규칙(pickRangeDate)이 애초에 못 만들게 한다.
 */
export function MeetingPeriodSheet({
  open,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: MeetingPeriodSheetProps) {
  const [draft, setDraft] = useState<MeetingPeriod>({ startDate, endDate })
  const [month, setMonth] = useState(() => initialMonth(startDate))

  // 열 때마다 필드의 현재 값으로 다시 시작한다 — 렌더 도중의 상태 조정 패턴(ReportDialog와 같은 이유,
  // 이펙트 안 setState는 캐스케이딩 렌더를 부른다는 lint 경고를 피한다)
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setDraft({ startDate, endDate })
      setMonth(initialMonth(startDate))
    }
  }

  useAppBack(
    () => {
      onClose()
    },
    { enabled: open },
  )

  const today = toIsoDate(new Date())
  const cells = buildMonthGrid(month.getFullYear(), month.getMonth())
  const complete = isValidMeetingPeriod(draft.startDate, draft.endDate)

  return (
    <BottomSheet
      open={open}
      title="기간 선택"
      onClose={onClose}
      footer={
        <Button
          variant="activated"
          className="h-[54px] w-full disabled:bg-interactive-accent disabled:opacity-40"
          disabled={!complete}
          onClick={() => {
            onConfirm(draft)
          }}
        >
          확인
        </Button>
      }
    >
      <p className="text-body-14md text-text-secondary" aria-live="polite">
        {complete
          ? `${formatDateDots(draft.startDate)} ~ ${formatDateDots(draft.endDate)}`
          : draft.startDate
            ? `${formatDateDots(draft.startDate)} ~ 종료일을 선택해주세요.`
            : '시작일을 선택해주세요.'}
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          className="press flex size-10 items-center justify-center rounded-full"
          onClick={() => {
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }}
        >
          <BackIcon className="size-6 text-icon-primary" />
        </button>
        <span className="text-title-16sb text-text-primary">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </span>
        <button
          type="button"
          aria-label="다음 달"
          className="press flex size-10 items-center justify-center rounded-full"
          onClick={() => {
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }}
        >
          <NextIcon className="size-6 text-icon-primary" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-2 text-caption-12rg text-text-tertiary">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${String(index)}`} />
          const isStart = date === draft.startDate
          const isEnd = date === draft.endDate
          const isEdge = isStart || isEnd
          return (
            <button
              key={date}
              type="button"
              aria-label={formatDateDots(date)}
              aria-pressed={isEdge}
              className={cn(
                'press my-0.5 flex h-10 justify-center text-body-16md text-text-primary',
                // 시작~종료 사이는 띠로 잇고, 양끝은 원 중심부터 안쪽 절반만 칠해 띠가 원 밖으로 안 나간다
                complete && date > draft.startDate && date < draft.endDate && 'bg-orange-50',
                complete &&
                  isStart &&
                  !isEnd &&
                  'bg-linear-to-r from-transparent from-50% to-orange-50 to-50%',
                complete &&
                  isEnd &&
                  !isStart &&
                  'bg-linear-to-l from-transparent from-50% to-orange-50 to-50%',
              )}
              onClick={() => {
                setDraft((prev) => pickRangeDate(prev, date))
              }}
            >
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-full',
                  isEdge && 'bg-interactive-accent text-text-inverse',
                  !isEdge && date === today && 'font-bold text-text-accent',
                )}
              >
                {Number(date.slice(-2))}
              </span>
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
