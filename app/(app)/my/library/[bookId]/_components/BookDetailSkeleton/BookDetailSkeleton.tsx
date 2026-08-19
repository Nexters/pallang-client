import { ScreenLayout } from '@/app/_global/_components/ScreenLayout/ScreenLayout'
import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'
import { RecordListSkeleton } from '@/app/_shared/user/_components/RecordListSkeleton/RecordListSkeleton'

import { BookHeaderSkeleton } from '../BookHeaderSkeleton/BookHeaderSkeleton'

/**
 * 책 상세가 도착하기 전 셸을 대신 세운다.
 * 도착할 화면과 같은 좌표(책 머리 → 탭 줄 → 회색 목록 면)를 써 자리가 튀지 않는다.
 */
export function BookDetailSkeleton() {
  return (
    <ScreenLayout title="내 서재">
      <div className="shrink-0 px-4 pt-2">
        <BookHeaderSkeleton />
      </div>
      <div className="flex shrink-0 justify-center p-2">
        {/* 탭 줄과 같은 크기(세 조각 × 66px + 패딩) */}
        <Skeleton className="h-[42px] w-[206px] rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-2 bg-bg-surface p-4">
        <RecordListSkeleton />
      </div>
    </ScreenLayout>
  )
}
