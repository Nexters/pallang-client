import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

/**
 * 프로필 설정 본문 골격 — 인증 판별과 프로필 조회가 끝날 때까지 선다.
 * 셸(TopBar)은 ProfileSettingsContent가 항상 들고 있으므로 여기서는 본문만 그린다.
 * 좌표는 실제 본문과 같다: 이미지 90px(py-6 중앙) + 라벨(lh 21px) + 입력(56px, rounded-2xl).
 */
export function ProfileSettingsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4">
      <div className="flex justify-center py-6">
        <Skeleton className="size-[90px] rounded-3xl" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-[21px] w-12" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-[21px] w-16" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
