/**
 * 책 검색 화면의 골격. 두 자리에서 쓴다 —
 * 씨앗을 읽는 동안의 Suspense fallback, 그리고 대목 씨앗을 물고 꾸미기 단계로 넘어가는 사이.
 */
export function TraceNewSkeleton() {
  return (
    <main className="-mt-(--safe-top) flex h-[calc(100%_+_var(--safe-top))] min-h-0 flex-col bg-bg-default pt-(--safe-top)">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="size-6 shrink-0 rounded bg-bg-surface" />
        <div className="h-6 w-20 rounded bg-bg-surface" />
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <div className="h-14 min-w-px flex-1 rounded-2xl bg-bg-surface" />
        <div className="size-14 shrink-0 rounded-2xl bg-neutral-200" />
      </div>
    </main>
  )
}
