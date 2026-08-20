import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

/**
 * 초대 미리보기와 같은 좌표 — 표지 72×48, 모임명 28(20/1.4), 책·저자 16(12/1.3), 인원 21(14/1.5).
 * 도착했을 때 자리가 튀지 않도록 바깥 정렬(가운데·gap-4)까지 그대로 쓴다.
 */
export function MeetingInviteSkeleton() {
  return (
    <div
      role="status"
      aria-label="초대 정보를 불러오는 중"
      aria-busy="true"
      className="flex flex-1 flex-col items-center justify-center gap-4"
    >
      <Skeleton className="h-18 w-12 rounded-md" />
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-[21px] w-28" />
    </div>
  )
}
