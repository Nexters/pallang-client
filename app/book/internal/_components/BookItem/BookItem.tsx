import type { ComponentPropsWithoutRef } from 'react'

import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { cn } from '@/app/_global/_services/cn.service'

type BookItemProps = ComponentPropsWithoutRef<'article'> & {
  author: string
  coverImageUrl?: null | string
  opinionCount: number
  passageCount: number
  publisher?: string
  title: string
}

function BookStat({ icon, value }: { icon: 'content' | 'pencil'; value: number }) {
  const Icon = icon === 'content' ? ContentIcon : PencilIcon

  return (
    <span className="flex shrink-0 items-center gap-0.5 rounded-lg bg-bg-surface px-1.5 py-1 text-body-14md text-text-tertiary">
      <span className="flex size-4 items-center justify-center opacity-20">
        <Icon className="size-4 text-icon-primary" aria-hidden="true" />
      </span>
      <span>{value}</span>
    </span>
  )
}

export function BookItem({
  author,
  className,
  coverImageUrl,
  opinionCount,
  passageCount,
  publisher,
  title,
  ...props
}: BookItemProps) {
  const description = publisher ? `${publisher} · ${author}` : author

  return (
    <article className={cn('flex w-full items-start gap-4', className)} {...props}>
      <div
        aria-hidden="true"
        className="h-[120px] w-20 shrink-0 rounded-[2px] border border-border-book/10 bg-neutral-200 shadow-[2px_4px_8px_rgba(0,0,0,0.08)]"
        style={
          coverImageUrl
            ? {
                backgroundImage: `url(${coverImageUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }
            : undefined
        }
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-4 pt-1">
        <div className="flex w-full min-w-0 flex-col items-start gap-1.5">
          <h2 className="w-full truncate text-title-18bd text-text-primary">{title}</h2>
          <p className="w-full truncate text-body-14md text-text-secondary/50">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          <BookStat icon="content" value={passageCount} />
          <BookStat icon="pencil" value={opinionCount} />
        </div>
      </div>
    </article>
  )
}
