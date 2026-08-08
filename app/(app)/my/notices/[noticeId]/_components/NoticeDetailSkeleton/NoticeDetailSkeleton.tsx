import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

/** 본문과 같은 좌표(제목·날짜 헤더 + 문단)로 자리를 지킨다 */
export function NoticeDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full last:w-2/3" />
        ))}
      </div>
    </div>
  )
}
