import { cn } from '@/app/_global/_services/cn.service'

const TAB_ITEMS = [0, 1, 2, 3, 4, 5] as const

/** 흔적 화면 로딩 폴백 — 헤더·페이지 탭·포스트잇·정렬 바·목록의 자리만 잡는다(디자인 174:6725).
    실제 화면과 달리 접힘 전환 좌표계가 없으므로 펼친 상태 치수를 그대로 박아 둔다 */
export function TraceScreenSkeleton() {
  return (
    <div className="-mt-(--safe-top) flex min-h-0 flex-1 flex-col overflow-hidden pt-(--safe-top)">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="h-6 w-20 rounded bg-bg-surface" />
        <div className="size-8 rounded-full bg-bg-surface" />
      </div>
      <div className="flex h-12 shrink-0 items-center gap-3 overflow-hidden px-4">
        {TAB_ITEMS.map((item) => (
          <div
            key={item}
            className={cn(
              'h-8 w-[50px] shrink-0 rounded',
              // 선택된 페이지 탭 자리 — 실제 화면에서도 첫 탭이 활성 상태로 열린다
              item === 0 ? 'bg-bg-black' : 'bg-bg-surface',
            )}
          />
        ))}
      </div>
      {/* 포스트잇 카드 — 기울기까지 같아야 데이터가 도착할 때 자리가 튀지 않는다 */}
      <div className="flex shrink-0 justify-center py-10">
        <div className="h-80 w-78 -rotate-3 rounded-lg bg-bg-surface" />
      </div>
      <div className="flex h-15 shrink-0 items-center justify-between bg-bg-black px-4">
        <div className="h-6 w-25 rounded bg-bg-dark" />
        <div className="h-6 w-15 rounded bg-bg-dark" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-12 border-t border-bg-dark bg-bg-black px-4 pt-8">
        <div className="flex flex-col gap-3">
          <div className="h-4.5 w-20 rounded bg-bg-dark" />
          <div className="flex flex-col gap-2">
            <div className="h-4.5 w-full rounded bg-bg-dark" />
            <div className="h-4.5 w-45 rounded bg-bg-dark" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-4.5 w-22.5 rounded bg-bg-dark" />
          <div className="flex flex-col gap-2">
            <div className="h-4.5 w-full rounded bg-bg-dark" />
            <div className="h-4.5 w-50 rounded bg-bg-dark" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 shrink-0 rounded-full bg-bg-dark" />
            <div className="h-3.5 w-22.5 rounded bg-bg-dark" />
          </div>
          <div className="flex flex-col gap-2 pl-10.5">
            <div className="h-3.5 w-full rounded bg-bg-dark" />
            <div className="h-3.5 w-50 rounded bg-bg-dark" />
          </div>
        </div>
      </div>
    </div>
  )
}
