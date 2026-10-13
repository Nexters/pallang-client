import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'

import { BOOK_RECORD_TABS } from '../../_data/bookRecordTab.constant'
import { BookEditAction } from '../BookEditAction/BookEditAction'
import { BookHeaderSkeleton } from '../BookHeaderSkeleton/BookHeaderSkeleton'

/** 탭 하나의 너비 — `BookRecordTabs`의 `w-16.5` */
const TAB_WIDTH = 66
/** 탭 목록이 두르는 여백 — `Tabs.List`의 `p-1` */
const TAB_LIST_PADDING = 4
/** 탭 한 줄의 높이. 비활성 탭(`text-body-14md`, line-height 1.5 → 21px)에 `py-2` 16px를 더한 값이 지배한다 */
const TAB_HEIGHT = 37

/**
 * 책 상세가 도착하기 전 셸을 대신 세운다.
 * 도착할 화면과 같은 좌표(`편집` 알약 → 책 머리 → 탭 줄 → 회색 목록 면)를 써 자리가 튀지 않는다.
 */
export function BookDetailSkeleton() {
  return (
    <ScreenLayout title="내 서재" action={<BookEditAction />}>
      <div className="shrink-0 px-4 pt-2">
        <BookHeaderSkeleton />
      </div>
      <div className="flex shrink-0 justify-center p-2">
        {/* 탭 수를 상수에서 받는다 — 탭이 하나 늘면 골격도 함께 늘어난다 */}
        <Skeleton
          className="rounded-full"
          style={{
            height: TAB_HEIGHT + TAB_LIST_PADDING * 2,
            width: BOOK_RECORD_TABS.length * TAB_WIDTH + TAB_LIST_PADDING * 2,
          }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">
        <RecordListSkeleton />
      </div>
    </ScreenLayout>
  )
}
