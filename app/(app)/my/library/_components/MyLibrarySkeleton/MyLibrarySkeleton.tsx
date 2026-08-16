import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const ROWS = [0, 1, 2, 3] as const

/** 목록과 같은 좌표(표지 80×120 + gap-4 + 항목 사이 12px)로 자리를 지킨다 */
export function MyLibrarySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {ROWS.map((row) => (
        <div key={row} className="flex w-full items-start gap-4">
          <Skeleton className="h-[120px] w-20 shrink-0 rounded-[2px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-[26px] w-40" />
              <Skeleton className="h-[18px] w-28" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-[26px] w-10 rounded-lg" />
              <Skeleton className="h-[26px] w-11 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
