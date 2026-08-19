import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const KEYS = ['name', 'capacity', 'book', 'period']

/** MeetingForm과 같은 좌표 — 라벨 18 + 8 + 입력 56 (+ 4 + 헬퍼 18) */
export function MeetingFormSkeleton() {
  return (
    <div
      role="status"
      aria-label="모임 정보를 불러오는 중"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      {KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <Skeleton className="h-[18px] w-14" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
