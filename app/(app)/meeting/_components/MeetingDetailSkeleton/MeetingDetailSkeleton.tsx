import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

export function MeetingDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="모임 정보를 불러오는 중"
      className="flex items-center justify-between gap-2 px-4 py-6"
    >
      <div className="flex flex-col gap-1">
        <Skeleton className="h-[22px] w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-9 w-20 rounded-full" />
    </div>
  )
}
