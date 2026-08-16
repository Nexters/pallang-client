import type { SelectedBook } from '../../_types/traceDraft.type'

type SelectedBookCardProps = {
  /** 아직 책을 고르지 않았으면 null이다 — 그래도 카드는 남아 '편집하기'로 시트를 다시 열 수 있다. */
  book: SelectedBook | null
  onEdit: () => void
}

/**
 * ③에서 고른 책을 한 줄로 확인시키는 카드 — 시안 3140:18263(343×64).
 *
 * 목록의 BookItem(표지 80×120·제목 18bd)을 쓰지 않는 이유는 크기 차이가 아니라 역할 차이다.
 * 여기 표지는 32×48이고 글자도 한 단계 작으며, 카드가 자기 배경·모서리·'편집하기'까지 안고 있다.
 * BookItem에 size 변형을 달면 목록에는 없는 편집 동작까지 공용 컴포넌트가 알아야 해서,
 * 이 지면에만 사는 카드로 따로 둔다.
 */
export function SelectedBookCard({ book, onEdit }: SelectedBookCardProps) {
  return (
    // h-16이 곧 시안의 64px다 — 표지(48) + py-2(8×2). 제목이 길어도 truncate라 높이가 흔들리지 않는다.
    <div className="flex h-16 items-center gap-2.5 rounded-2xl bg-bg-surface px-4 py-2">
      {book && (
        <div
          aria-hidden="true"
          className="h-12 w-8 shrink-0 rounded-[4px] bg-neutral-200 bg-cover bg-center"
          style={book.coverImageUrl ? { backgroundImage: `url(${book.coverImageUrl})` } : undefined}
        />
      )}
      <div className="flex min-w-px flex-1 flex-col justify-center gap-1">
        {book ? (
          <>
            <p className="truncate text-title-14bd text-text-primary">{book.title}</p>
            <p className="truncate text-caption-12rg text-text-tertiary">{book.author}</p>
          </>
        ) : (
          <p className="truncate text-caption-12rg text-text-tertiary">아직 고른 책이 없어요.</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="press shrink-0 rounded-full border border-border-default px-2.5 py-1.5 text-body-14md text-text-primary"
      >
        편집하기
      </button>
    </div>
  )
}
