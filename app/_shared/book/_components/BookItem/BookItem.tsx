import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import ContentIcon from '@/app/_global/_components/Icon/assets/content.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { cn } from '@/app/_global/_services/cn.service'

type BookItemProps = ComponentPropsWithoutRef<'article'> & {
  author: string
  coverImageUrl?: null | string
  /** 외부(알라딘) 검색 결과에는 없는 값이다. 없으면 배지를 그리지 않는다. */
  opinionCount?: number
  passageCount?: number
  publisher?: string
  /** 대목·흔적 수 오른쪽에 붙는 자리. 책 상세의 독서 상태 뱃지가 여기로 들어온다. */
  statusBadge?: ReactNode
  title: string
  /** 기본 목록은 한 줄 말줄임이고, 선택 리본이 붙는 검색 결과만 두 줄까지 보여준다. */
  titleBehavior?: 'clamp' | 'truncate'
}

/**
 * 표지 URL은 알라딘·API 서버에서 오는 통제 밖 값이다. 그대로 `url()`에 넣으면 URL 안의
 * `)`·공백·따옴표가 선언을 끊어 `background-image`가 통째로 무효가 되고, 오류 없이 배경색만 남는다.
 * 따옴표로 감싸 `)`·공백을 무해화하고, 그 문자열을 깨는 `\`·`"`는 이스케이프한다.
 * 줄바꿈은 CSS 문자열 안에 올 수 없어(이스케이프해도 마찬가지) 퍼센트 인코딩한다.
 */
function toCoverBackgroundImage(coverImageUrl: string) {
  const escaped = coverImageUrl.replace(/["\\\f\n\r]/g, (char) =>
    char === '"' || char === '\\' ? `\\${char}` : encodeURIComponent(char),
  )

  return `url("${escaped}")`
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
  statusBadge,
  title,
  titleBehavior = 'truncate',
  ...props
}: BookItemProps) {
  const description = publisher ? `${publisher} · ${author}` : author

  return (
    <article className={cn('flex w-full items-start gap-4', className)} {...props}>
      <div
        aria-hidden="true"
        className="h-[120px] w-20 shrink-0 rounded-[2px] border border-border-book/10 bg-interactive-accent shadow-[2px_4px_8px_rgba(0,0,0,0.08)]"
        style={
          coverImageUrl
            ? {
                backgroundImage: toCoverBackgroundImage(coverImageUrl),
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }
            : undefined
        }
      />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-4 pt-1">
        <div className="flex w-full min-w-0 flex-col items-start gap-1.5">
          <h2
            className={cn(
              'w-full text-title-18bd text-text-primary',
              titleBehavior === 'clamp' ? 'line-clamp-2 whitespace-normal break-words' : 'truncate',
            )}
          >
            {title}
          </h2>
          <p className="w-full truncate text-body-14md text-text-secondary/50">{description}</p>
        </div>
        {passageCount !== undefined && opinionCount !== undefined && (
          <div className="flex items-center gap-1">
            <BookStat icon="content" value={passageCount} />
            <BookStat icon="pencil" value={opinionCount} />
            {statusBadge}
          </div>
        )}
      </div>
    </article>
  )
}
