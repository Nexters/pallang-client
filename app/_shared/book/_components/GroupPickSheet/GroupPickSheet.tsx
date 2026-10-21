'use client'

import { useRouter } from 'next/navigation'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'
import type { GroupSummary } from '@/app/_global/_queries/group.queries'
import { buildTraceHref } from '@/app/_shared/trace/_data/traceTarget.model'

type GroupPickSheetProps = {
  open: boolean
  bookId: number | null
  /** 이 책을 읽는 내 모임 전부(진행 중 먼저). 닫히는 동안에도 목록이 비지 않게 마지막 값을 넘겨받는다 */
  groups: GroupSummary[]
  onClose: () => void
  /** 고른 모임으로 떠나기 직전에 할 일(검색어 비우기 등) */
  onLeave?: () => void
}

/**
 * 공개 기록은 없고 같은 책을 읽는 내 모임이 둘 이상일 때 어느 모임 기록을 열지 고르는 시트.
 * 모임마다 대목이 따로라 하나를 골라야 흔적 화면을 열 수 있다. 시안이 없어 책 목록의 행 구분(1px 선)을 따랐고,
 * 모임이 많아 화면을 넘으면 시트 안에서 스크롤한다.
 */
export function GroupPickSheet({ open, bookId, groups, onClose, onLeave }: GroupPickSheetProps) {
  const router = useRouter()

  return (
    <BottomSheet
      open={open}
      title="어느 모임 기록을 볼까요?"
      onClose={onClose}
      contentClassName="max-h-[60dvh] gap-0 overflow-y-auto px-4 pt-0 pb-4"
    >
      <ul aria-label="이 책을 읽는 내 모임">
        {groups.map((group, index) => (
          <li
            key={group.groupId}
            className={index > 0 ? 'border-t border-border-default' : undefined}
          >
            <button
              type="button"
              className="press flex w-full items-center gap-3 py-4 text-left"
              onClick={() => {
                if (bookId === null) return
                onLeave?.()
                router.push(buildTraceHref(bookId, { groupId: group.groupId }))
                onClose()
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-body-16bd text-text-primary">{group.name}</span>
                <span className="text-caption-12rg text-text-tertiary">
                  {group.ended ? '종료된 모임' : `${String(group.memberCount)}명이 함께 읽는 중`}
                </span>
              </span>
              <NextIcon width={20} height={20} aria-hidden className="shrink-0 text-icon-primary" />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  )
}
