import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const ROW_KEYS = ['first', 'second', 'third'] as const

/** NotificationItem과 같은 좌표 — 행 높이 106px(py-5 + 라벨·제목·본문 줄높이)를 그대로 따른다 */
export function NotificationListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {ROW_KEYS.map((key) => (
        <div key={key} className="flex items-start gap-3 px-4 py-5">
          <Skeleton className="size-8 shrink-0 rounded-xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-[22px] w-3/4" />
              <Skeleton className="h-4.5 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
