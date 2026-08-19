import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const ROWS = [0, 1, 2, 3] as const

/** 목록과 같은 좌표(표지 80×120 + gap-4 + 행 사이 12px·구분선·12px)로 자리를 지킨다 */
export function MyLibrarySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {ROWS.map((row, index) => (
        <div key={row} className="flex flex-col gap-3">
          <div className="flex w-full items-start gap-4">
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
          {/* 목록과 같이 행 사이에만 선을 둔다 — 없으면 도착할 때 25px씩 밀린다 */}
          {index < ROWS.length - 1 && <div className="h-px w-full bg-border-default" />}
        </div>
      ))}
    </div>
  )
}
