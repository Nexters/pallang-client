'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { BOOK_STATUS, type BookStatus } from '@/app/_global/_queries/book.queries'
import { cn } from '@/app/_global/_services/cn.service'

type BookStatusSheetProps = {
  open: boolean
  /** 시트가 들고 있는 선택값. 여는 쪽이 현재 상태로 채워 넣는다 */
  value: BookStatus
  saving: boolean
  onChange: (status: BookStatus) => void
  onClose: () => void
  onSave: () => void
}

function StatusOption({
  label,
  selected,
  disabled = false,
  onClick,
}: {
  label: string
  selected: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // 시안(225:8880)의 선택지는 모서리를 두지 않은 80px 타일이다
        'press flex h-20 min-w-px flex-1 flex-col justify-center p-5 text-left text-title-18bd',
        selected ? 'bg-bg-dark text-text-inverse' : 'bg-bg-surface text-text-secondary',
        disabled && 'opacity-40',
      )}
    >
      {label}
    </button>
  )
}

/** 독서 상태 설정 바텀시트(Figma 225:8867 · 225:8877). */
export function BookStatusSheet({
  open,
  value,
  saving,
  onChange,
  onClose,
  onSave,
}: BookStatusSheetProps) {
  const isReading = value === BOOK_STATUS.READING

  return (
    <BottomSheet
      open={open}
      title="독서 상태를 설정할 수 있어요"
      onClose={onClose}
      contentClassName="p-4"
      footer={
        <Button className="h-[54px] w-full" disabled={!isReading} loading={saving} onClick={onSave}>
          저장하기
        </Button>
      }
    >
      <div role="radiogroup" aria-label="독서 상태" className="flex gap-2">
        {/* ponytail: 서버가 주는 상태 enum이 READING·PLANNED뿐이라 `완독`으로 보낼 값이 없다.
            PLANNED는 뜻이 다르므로(읽고 싶은 책) 대신 끼워 넣지 않고, 시안대로 그리되 눌리지 않게
            둔다. 스펙에 FINISHED가 들어오면 disabled와 이 주석을 지우고 onClick만 달면 된다. */}
        <StatusOption label="완독" selected={false} disabled />
        <StatusOption
          label="읽고 있는 책"
          selected={isReading}
          onClick={() => {
            onChange(BOOK_STATUS.READING)
          }}
        />
      </div>
    </BottomSheet>
  )
}
