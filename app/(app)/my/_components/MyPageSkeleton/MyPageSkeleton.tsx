import { Skeleton } from '@/app/_global/_components/Skeleton/Skeleton'

const RECORD_ROWS = [0, 1] as const
const SETTING_ROWS = [0, 1, 2, 3, 4] as const

/**
 * 마이페이지 본문 골격 — 인증 판별과 프로필 조회가 끝날 때까지 선다.
 * 셸(TabScreenLayout·헤더)은 MyPageView가 항상 들고 있으므로 여기서는 본문만 그린다.
 *
 * 로그인·비로그인 어느 쪽으로 결정될지 모르는 시점이라, 두 화면이 공유하는 뼈대만 둔다
 * (프로필 줄 + 목록 섹션). 항목 수는 실제 화면과 자리가 어긋나지 않게 로그인 쪽에 맞춘다
 * (내 기록 2개 + 설정 5개).
 */
export function MyPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 py-4">
      <section className="flex items-center gap-3 px-4">
        <Skeleton className="size-18 shrink-0 rounded-3xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-[22px] w-28" />
          <Skeleton className="h-[18px] w-44" />
        </div>
      </section>

      <SectionSkeleton rows={RECORD_ROWS} />
      <SectionSkeleton rows={SETTING_ROWS} />
    </div>
  )
}

function SectionSkeleton({ rows }: { rows: readonly number[] }) {
  return (
    <section className="flex flex-col gap-6 px-4">
      <Skeleton className="h-6 w-14" />
      <ul className="flex w-full flex-col gap-4">
        {rows.map((row) => (
          <li key={row}>
            <Skeleton className="h-5 w-32" />
          </li>
        ))}
      </ul>
    </section>
  )
}
