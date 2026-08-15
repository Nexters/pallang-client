import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

/** 본문과 같은 좌표(문단 줄)로 자리를 지킨다 — 패딩은 셸 body(p-6)가 소유한다 */
export function NoticeDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full last:w-2/3" />
      ))}
    </div>
  )
}
