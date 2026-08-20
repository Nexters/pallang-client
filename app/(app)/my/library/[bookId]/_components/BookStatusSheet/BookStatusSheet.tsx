'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { BOOK_STATUS, type BookStatus } from '@/app/_global/_queries/book.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { BOOK_STATUS_LABEL } from '../../_data/bookStatus.constant'

type BookStatusSheetProps = {
  open: boolean
  /** 시트가 들고 있는 선택값. 여는 쪽이 현재 상태로 채워 넣는다 */
  value: BookStatus
  /** 저장할 것이 없을 때(고른 값이 이미 저장된 값과 같을 때) 버튼을 죽인다 */
  saveDisabled: boolean
  saving: boolean
  onChange: (status: BookStatus) => void
  onClose: () => void
  onSave: () => void
}

function StatusOption({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        // 시안의 선택지는 모서리를 두지 않은 80px 타일이다
        'press flex h-20 min-w-px flex-1 flex-col justify-center p-5 text-left text-title-18bd',
        selected ? 'bg-bg-dark text-text-inverse' : 'bg-bg-surface text-text-secondary',
      )}
    >
      {label}
    </button>
  )
}

/** 독서 상태 설정 바텀시트. */
export function BookStatusSheet({
  open,
  value,
  saveDisabled,
  saving,
  onChange,
  onClose,
  onSave,
}: BookStatusSheetProps) {
  // 시트에 해제 버튼이 없다 — 고른 것을 다시 누르면 풀리고, 그대로 저장하면 상태가 지워진다
  const toggle = (status: NonNullable<BookStatus>) => {
    onChange(value === status ? null : status)
  }

  return (
    <BottomSheet
      open={open}
      title="독서 상태를 설정할 수 있어요"
      onClose={onClose}
      contentClassName="p-4"
      footer={
        <Button
          className="h-[54px] w-full"
          disabled={saveDisabled}
          loading={saving}
          onClick={onSave}
        >
          저장하기
        </Button>
      }
    >
      <div role="radiogroup" aria-label="독서 상태" className="flex gap-2">
        {/* 시안 순서대로 완독이 왼쪽이다 */}
        {[BOOK_STATUS.FINISHED, BOOK_STATUS.READING].map((status) => (
          <StatusOption
            key={status}
            label={BOOK_STATUS_LABEL[status]}
            selected={value === status}
            onClick={() => {
              toggle(status)
            }}
          />
        ))}
      </div>
    </BottomSheet>
  )
}
