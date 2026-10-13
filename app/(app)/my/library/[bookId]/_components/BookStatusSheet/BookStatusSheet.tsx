'use client'

import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'

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
      {/*
        시트에 해제 버튼이 없다 — 고른 것을 다시 누르면 풀리고, 그대로 저장하면 상태가 지워진다.
        그래서 라디오가 아니라 눌림 토글이다. 라디오는 고른 것을 되돌릴 수 없어, 그 역할로 읽어 주면
        스크린리더가 실제 동작을 설명하지 못한다.

        base-ui `ToggleGroup` 위에 올린 이유는 두 가지다. multiple 기본값이 false라 한 번에 하나만
        눌린 상태로 묶어 주고(둘은 서로 배타적이다), 그룹이 Composite라 눌린 항목 하나만 탭 순서에
        두는 roving tabindex와 좌우 키 이동이 딸려 온다. role과 aria만 손으로 붙이면 보조기기에는
        묶여 읽히지만 키보드로는 버튼 두 개일 뿐이다(BookRecordTabs가 탭에서 같은 이유로 base-ui를 쓴다).
      */}
      <ToggleGroup
        aria-label="독서 상태"
        value={value ? [value] : []}
        onValueChange={(next) => {
          onChange(next[0] ?? null)
        }}
        className="flex gap-2"
      >
        {/* 시안 순서대로 완독이 왼쪽이다 */}
        {[BOOK_STATUS.FINISHED, BOOK_STATUS.READING].map((status) => (
          <Toggle
            key={status}
            value={status}
            className={cn(
              // 시안의 선택지는 모서리를 두지 않은 80px 타일이다
              'press flex h-20 min-w-px flex-1 flex-col justify-center p-5 text-left text-title-18bd',
              value === status
                ? 'bg-bg-dark text-text-inverse'
                : 'bg-bg-surface text-text-secondary',
            )}
          >
            {BOOK_STATUS_LABEL[status]}
          </Toggle>
        ))}
      </ToggleGroup>
    </BottomSheet>
  )
}
