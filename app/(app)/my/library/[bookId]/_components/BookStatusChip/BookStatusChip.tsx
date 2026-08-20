'use client'

import type { BookStatus } from '@/app/_global/_queries/book.queries'
import { cn } from '@/app/_global/_services/cn.service'

import { BOOK_STATUS_LABEL } from '../../_data/bookStatus.constant'

/**
 * 책 머리의 대목·흔적 수 옆에 서는 독서 상태 뱃지 겸 설정 시트를 여는 자리.
 *
 * 시안은 시트가 열린 화면에만 이 뱃지를 그리고 여는 손잡이를 따로 두지 않았다.
 * 상태가 붙은 유일한 자리가 여기라 뱃지 자체를 손잡이로 삼는다. 다만 상태가 없을 때 뱃지를
 * 지워 버리면 시트로 들어갈 길이 통째로 사라지므로, 같은 알약을 대목·흔적 뱃지와 같은 톤으로
 * 낮춰 `독서 상태`로 남긴다 — 새 모양을 만들지 않고 자리만 지킨다.
 */
export function BookStatusChip({ status, onClick }: { status: BookStatus; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press flex shrink-0 items-center rounded-lg px-1.5 py-1 text-body-14md',
        status ? 'bg-bg-gray text-text-inverse' : 'bg-bg-surface text-text-tertiary',
      )}
    >
      {status ? BOOK_STATUS_LABEL[status] : '독서 상태'}
    </button>
  )
}
