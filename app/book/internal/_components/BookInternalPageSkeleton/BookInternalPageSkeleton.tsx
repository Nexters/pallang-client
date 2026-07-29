const SKELETON_ITEMS = [0, 1, 2] as const

export function BookInternalPageSkeleton() {
  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      <div className="flex w-full shrink-0 items-center gap-3 px-4 py-3">
        <div className="size-8 shrink-0 rounded-full bg-neutral-200" />
        <div className="h-6 w-20 shrink-0 rounded bg-bg-surface" />
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 px-4 py-1">
        <div className="h-14 min-w-px flex-1 rounded-xl bg-bg-surface" />
        <div className="size-14 shrink-0 rounded-full bg-neutral-200" />
      </div>
      <div className="flex w-full flex-col gap-4 px-4 py-[30px]">
        {SKELETON_ITEMS.map((item, index) => (
          <div key={item} className="flex w-full flex-col gap-3">
            <div className="flex w-full items-start gap-3">
              <div className="h-[120px] w-20 shrink-0 rounded bg-neutral-200" />
              <div className="flex min-w-px flex-1 flex-col items-start gap-1 pt-1">
                <div className="h-[22px] w-[140px] rounded-[3px] bg-bg-surface" />
                <div className="flex items-start gap-1.5">
                  <div className="h-[18px] w-[47px] rounded-[2px] bg-bg-surface" />
                  <div className="h-[18px] w-[47px] rounded-[2px] bg-bg-surface" />
                </div>
              </div>
            </div>
            {index < SKELETON_ITEMS.length - 1 && <div className="h-px w-full bg-border-default" />}
          </div>
        ))}
      </div>
    </main>
  )
}
