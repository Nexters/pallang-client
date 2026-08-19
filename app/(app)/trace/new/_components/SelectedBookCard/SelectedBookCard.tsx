import { cn } from '@/app/_global/_services/cn.service'

import type { SelectedBook } from '../../_types/traceDraft.type'

type SelectedBookCardProps = {
  /** 아직 책을 고르지 않았으면 null이다 — 그래도 카드는 남아 시트를 열 수 있다. */
  book: SelectedBook | null
  onEdit: () => void
  /**
   * 책을 고치러 가는 길을 어디에 두는가.
   * - `pill` ③의 카드 — 오른쪽에 '편집하기' 버튼이 붙는다.
   * - `card` ①·② 상단의 카드 — 시안(3140:18272)에 버튼이 따로 없어 카드 전체가 버튼이다.
   */
  affordance?: 'card' | 'pill'
}

// 시안 343×64 — h-16이 곧 64px다(표지 48 + py-2×2). 제목이 길어도 truncate라 높이가 흔들리지 않는다.
const CARD_CLASS = 'flex h-16 w-full items-center gap-2.5 rounded-2xl bg-bg-surface px-4 py-2'

/**
 * 이 흔적이 붙을 책을 한 줄로 보여주는 카드 — 시안(343×64).
 *
 * 목록의 BookItem(표지 80×120·제목 18bd)을 쓰지 않는 이유는 크기 차이가 아니라 역할 차이다.
 * 여기 표지는 32×48이고 글자도 한 단계 작으며, 카드가 자기 배경·모서리·편집 동작까지 안고 있다.
 * BookItem에 size 변형을 달면 목록에는 없는 편집 동작까지 공용 컴포넌트가 알아야 해서,
 * 이 지면에만 사는 카드로 따로 둔다.
 */
export function SelectedBookCard({ affordance = 'pill', book, onEdit }: SelectedBookCardProps) {
  const content = (
    <>
      {book && (
        <div
          aria-hidden="true"
          className="h-12 w-8 shrink-0 rounded-[4px] bg-neutral-200 bg-cover bg-center"
          style={book.coverImageUrl ? { backgroundImage: `url(${book.coverImageUrl})` } : undefined}
        />
      )}
      <div className="flex min-w-px flex-1 flex-col justify-center gap-1 text-left">
        {book ? (
          <>
            <p className="truncate text-title-14bd text-text-primary">{book.title}</p>
            <p className="truncate text-caption-12rg text-text-tertiary">{book.author}</p>
          </>
        ) : (
          <p className="truncate text-caption-12rg text-text-tertiary">아직 고른 책이 없어요.</p>
        )}
      </div>
    </>
  )

  if (affordance === 'card') {
    return (
      <button
        type="button"
        aria-label="책 편집하기"
        onClick={onEdit}
        className={cn(CARD_CLASS, 'press')}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={CARD_CLASS}>
      {content}
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
