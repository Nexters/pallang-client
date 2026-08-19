import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const KEYS = ['a', 'b']

/** 실제 카드(MeetingCard)와 같은 좌표 — 도착했을 때 자리가 튀지 않는다 */
export function MeetingListSkeleton() {
  return (
    <div
      role="status"
      aria-label="모임을 불러오는 중"
      aria-busy="true"
      className="flex flex-col gap-3 px-4 pt-4 pb-6"
    >
      {KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-6 rounded-2xl bg-bg-default p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-18 w-12 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-12 rounded-2xl" />
            <Skeleton className="h-12 flex-1 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
