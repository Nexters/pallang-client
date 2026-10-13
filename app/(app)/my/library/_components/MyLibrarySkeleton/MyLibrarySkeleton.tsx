import { BookHeaderSkeleton } from '../../[bookId]/_components/BookHeaderSkeleton/BookHeaderSkeleton'

const ROWS = [0, 1, 2, 3] as const

/**
 * 목록과 같은 좌표(표지 80×120 + gap-4 + 행 사이 12px·구분선·12px)로 자리를 지킨다.
 * 행 하나는 책 상세 머리와 같은 `BookItem` 골격이라 `BookHeaderSkeleton`을 그대로 쌓는다.
 */
export function MyLibrarySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {ROWS.map((row, index) => (
        <div key={row} className="flex flex-col gap-3">
          <BookHeaderSkeleton />
          {/* 목록과 같이 행 사이에만 선을 둔다 — 없으면 도착할 때 25px씩 밀린다 */}
          {index < ROWS.length - 1 && <div className="h-px w-full bg-border-default" />}
        </div>
      ))}
    </div>
  )
}
