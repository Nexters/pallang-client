'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { useHardwareBackRegistry } from '@/app/_global/_hooks/useHardwareBackRegistry'

import { isIsoDate, isValidMeetingPeriod } from '../../_services/meetingDate.service'

export type MeetingPeriod = { startDate: string; endDate: string }

type MeetingPeriodSheetProps = {
  open: boolean
  startDate: string
  endDate: string
  onClose: () => void
  onConfirm: (period: MeetingPeriod) => void
}

const INPUT_CLASS =
  'h-14 w-full rounded-2xl bg-bg-surface p-4 text-body-16md text-text-primary outline-none'

/**
 * 기간 피커 — 시안이 없어 바텀시트에 네이티브 날짜 입력 두 칸(기기 피커를 그대로 쓴다).
 * 종료 < 시작은 서버가 GROUP_400_1로 거절하므로 여기서 막는다.
 */
export function MeetingPeriodSheet({
  open,
  startDate,
  endDate,
  onClose,
  onConfirm,
}: MeetingPeriodSheetProps) {
  const startId = useId()
  const endId = useId()
  const [draft, setDraft] = useState<MeetingPeriod>({ startDate, endDate })
  const { register } = useHardwareBackRegistry()
  // onClose는 매 렌더 새로 만들어져 의존성에 걸면 시트가 열려 있는 동안 등록·해제가 반복된다(useHardwareBack 선례)
  const onCloseRef = useRef(onClose)

  // 열 때마다 필드의 현재 값으로 다시 시작한다 — 렌더 도중의 상태 조정 패턴(ReportDialog와 같은 이유,
  // 이펙트 안 setState는 캐스케이딩 렌더를 부른다는 lint 경고를 피한다)
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) setDraft({ startDate, endDate })
  }

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    return register(() => {
      onCloseRef.current()
    })
  }, [open, register])

  const bothFilled = isIsoDate(draft.startDate) && isIsoDate(draft.endDate)
  const orderError = bothFilled && !isValidMeetingPeriod(draft.startDate, draft.endDate)

  return (
    <BottomSheet
      open={open}
      title="기간 선택"
      onClose={onClose}
      footer={
        <Button
          variant="activated"
          className="h-[54px] w-full disabled:bg-interactive-accent disabled:opacity-40"
          disabled={!bothFilled || orderError}
          onClick={() => {
            onConfirm(draft)
          }}
        >
          확인
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={startId} className="text-body-14md text-text-secondary">
          시작일
        </label>
        <input
          id={startId}
          type="date"
          value={draft.startDate}
          className={INPUT_CLASS}
          onChange={(event) => {
            setDraft((prev) => ({ ...prev, startDate: event.target.value }))
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={endId} className="text-body-14md text-text-secondary">
          종료일
        </label>
        <input
          id={endId}
          type="date"
          value={draft.endDate}
          min={draft.startDate || undefined}
          className={INPUT_CLASS}
          onChange={(event) => {
            setDraft((prev) => ({ ...prev, endDate: event.target.value }))
          }}
        />
        {orderError && (
          <p className="text-body-14md text-text-accent">종료일은 시작일보다 빠를 수 없어요.</p>
        )}
      </div>
    </BottomSheet>
  )
}
