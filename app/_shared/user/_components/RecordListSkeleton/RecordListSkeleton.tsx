import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

/** 목록에 세울 골격 카드 수 — 화면을 한 번 채우는 만큼이면 충분하다 */
const PLACEHOLDER_COUNT = 4

/**
 * 관리 목록(좋아요·스포일러)이 도착하기 전 자리를 지키는 골격.
 * `RecordCard`와 같은 좌표(gap-2 + p-4 + 머리줄·점선·본문 3줄)를 쓴다 — 도착했을 때 자리가 튀지 않는다.
 */
export function RecordListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 border border-border-book bg-bg-default p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="size-5" />
          </div>
          <div className="border-t border-dashed border-border-book" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
