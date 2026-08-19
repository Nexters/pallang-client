'use client'

import { BOOK_STATUS, type BookStatus } from '@/app/_global/_queries/book.queries'
import { cn } from '@/app/_global/_services/cn.service'

/**
 * 책 머리의 대목·흔적 수 옆에 서는 독서 상태 뱃지 겸 설정 시트를 여는 자리(Figma 225:13279).
 *
 * 시안은 시트가 열린 화면(225:13222)에만 이 뱃지를 그리고 여는 손잡이를 따로 두지 않았다.
 * 상태가 붙은 유일한 자리가 여기라 뱃지 자체를 손잡이로 삼는다. 다만 상태가 없을 때 뱃지를
 * 지워 버리면 시트로 들어갈 길이 통째로 사라지므로, 같은 알약을 대목·흔적 뱃지와 같은 톤으로
 * 낮춰 `독서 상태`로 남긴다 — 새 모양을 만들지 않고 자리만 지킨다.
 */
export function BookStatusChip({ status, onClick }: { status: BookStatus; onClick: () => void }) {
  // 시안에 PLANNED(읽고 싶은 책) 뱃지가 없다. 없는 라벨을 지어내는 대신 상태 없음과 같이 다룬다
  // — 시트의 선택지에도 PLANNED가 없어 저장 경로로 되돌아오지 않는다.
  const isReading = status === BOOK_STATUS.READING

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press flex shrink-0 items-center rounded-lg px-1.5 py-1 text-body-14md',
        isReading ? 'bg-bg-gray text-text-inverse' : 'bg-bg-surface text-text-tertiary',
      )}
    >
      {isReading ? '읽고 있는 책' : '독서 상태'}
    </button>
  )
}
