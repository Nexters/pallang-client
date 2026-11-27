import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import MeatballsMenuIcon from '@/app/_global/_components/Icon/assets/meatballs-menu.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import type { GroupBook } from '@/app/_global/_queries/group.queries'

import { formatMeetingDeadline } from '../../_services/meetingDate.service'

export function MeetingBookItem({ book, onMore }: { book: GroupBook; onMore?: () => void }) {
  const period = book.endDate ? formatMeetingDeadline(book.endDate) : null

  return (
    <article className="flex shrink-0 flex-col justify-center gap-4 rounded-2xl bg-bg-default p-4">
      <div className="flex items-start gap-3">
        <div className="h-[72px] w-12 shrink-0 overflow-hidden rounded-md bg-bg-surface">
          {book.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- 외부 도서 표지 도메인은 고정되어 있지 않다
            <img src={book.coverImageUrl} alt="" className="size-full object-cover" />
          )}
        </div>
        <div className="relative min-w-0 flex-1">
          <h3 className="truncate pr-10 font-pretendard text-title-18bd leading-[1.4] text-text-primary">
            {book.title}
          </h3>
          <button
            type="button"
            aria-label={`${book.title} 편집`}
            onClick={onMore}
            aria-disabled={!onMore || undefined}
            className="press absolute top-0 right-0 flex size-8 items-center justify-center rounded-lg bg-bg-surface backdrop-blur-[1px]"
          >
            <MeatballsMenuIcon className="size-6 text-icon-primary" />
          </button>
          <p className="mt-0.5 truncate font-pretendard text-caption-12rg leading-[1.2] tracking-[-0.02em] text-text-tertiary">
            {book.author}
            {period && ` · ${period}`}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="flex items-center gap-0.5 rounded-lg bg-bg-surface px-1.5 py-1 text-body-14md text-text-tertiary">
              <ContentIcon aria-hidden className="size-4 text-icon-primary opacity-20" />
              {book.passageCount}
            </span>
            <span className="flex items-center gap-0.5 rounded-lg bg-bg-surface px-1.5 py-1 text-body-14md text-text-tertiary">
              <PencilIcon aria-hidden className="size-4 text-icon-primary opacity-20" />
              {book.opinionCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
