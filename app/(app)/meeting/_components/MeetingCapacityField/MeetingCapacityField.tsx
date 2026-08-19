'use client'

import { Select as BaseSelect } from '@base-ui/react/select'
import { useId } from 'react'

import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { MEETING_CAPACITY_MAX, MEETING_CAPACITY_MIN } from '../../_data/meeting.constant'
import { MeetingField } from '../MeetingField/MeetingField'

type MeetingCapacityFieldProps = {
  value: number
  onChange: (value: number) => void
  /** 수정 폼의 현재 참여 인원 — 이보다 적은 정원은 고를 수 없다(서버 409) */
  minCapacity?: number
}

const OPTIONS = Array.from(
  { length: MEETING_CAPACITY_MAX - MEETING_CAPACITY_MIN + 1 },
  (_, index) => {
    const n = MEETING_CAPACITY_MIN + index
    return { value: String(n), label: `${String(n)}명` }
  },
)

/** base-ui Select 값은 문자열이다(Select.tsx와 같은 규약) — 숫자는 양 끝에서 변환한다 */
export function MeetingCapacityField({
  value,
  onChange,
  minCapacity = MEETING_CAPACITY_MIN,
}: MeetingCapacityFieldProps) {
  const labelId = useId()
  return (
    <MeetingField label="인원" required helperText="최대 10명까지 가능해요." labelId={labelId}>
      <BaseSelect.Root<string>
        items={OPTIONS}
        value={String(value)}
        onValueChange={(next) => {
          if (next !== null) onChange(Number(next))
        }}
      >
        {/* 시안 343×56 surface r16 p16, 값 16md #111, 우측 24px 아래 셰브론(next 글리프 90° 회전, Icon/Muted) */}
        <BaseSelect.Trigger
          aria-labelledby={labelId}
          aria-required
          className="flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl bg-bg-surface p-4 text-body-16md text-text-primary outline-none"
        >
          <BaseSelect.Value />
          {/* next 글리프를 90° 돌려 아래 셰브론(시안) — 열리면 래퍼가 180° 더 돌아 위를 본다 */}
          <BaseSelect.Icon className="flex size-6 shrink-0 items-center justify-center transition-transform duration-fast ease-standard data-popup-open:rotate-180">
            <NextIcon className="size-6 rotate-90 text-icon-muted" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            alignItemWithTrigger={false}
            sideOffset={4}
            align="start"
            className="z-50 outline-none"
          >
            {/* 열림 상태 시안이 없다 — 필드와 같은 면(surface r16)에 한 줄 44px 목록으로 */}
            <BaseSelect.Popup
              className={cn(
                'scrollbar-none max-h-(--available-height) w-(--anchor-width) overflow-y-auto overscroll-contain rounded-2xl bg-bg-default p-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] outline-none',
                'origin-top transition-[opacity,scale] duration-fast ease-enter',
                'data-starting-style:scale-y-95 data-starting-style:opacity-0 data-ending-style:scale-y-95 data-ending-style:opacity-0 data-ending-style:ease-exit',
              )}
            >
              {OPTIONS.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={Number(option.value) < minCapacity}
                  className="flex h-11 cursor-pointer items-center rounded-xl px-3 text-body-16md text-text-primary outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 data-highlighted:bg-bg-surface data-selected:text-text-accent"
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </MeetingField>
  )
}
