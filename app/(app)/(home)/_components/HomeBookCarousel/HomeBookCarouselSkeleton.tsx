import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

export function HomeBookCarouselSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-label="홈 책 목록 로딩 중">
      <div className="relative h-[340px] w-full overflow-hidden">
        <div className="absolute top-[35px] left-1/2 h-[270px] w-[174px] -translate-x-[calc(50%+214px)]">
          <Skeleton className="size-full rounded-sm border border-bg-surface" />
        </div>
        <div className="absolute top-0 left-1/2 h-[340px] w-[220px] -translate-x-1/2">
          <Skeleton className="size-full rounded-sm border border-bg-surface" />
        </div>
        <div className="absolute top-[35px] left-1/2 h-[270px] w-[174px] translate-x-[126px]">
          <Skeleton className="size-full rounded-sm border border-bg-surface" />
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div className="flex w-[220px] flex-col items-start justify-center gap-[10px]">
          <Skeleton className="h-[11px] w-[165px]" />
          <div className="flex w-full items-center justify-between px-0.5">
            <Skeleton className="h-[10px] w-[35px]" />
            <Skeleton className="h-[28px] w-[54px] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
