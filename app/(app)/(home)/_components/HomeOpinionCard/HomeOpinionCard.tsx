'use client'

import Link from 'next/link'

import type { UserOpinion } from '@/app/_global/_queries/user.queries'
import { cn } from '@/app/_global/_services/cn.service'
import { buildTraceTargetHref } from '@/app/_shared/trace/_data/traceTarget.model'
import { formatRecordedDate } from '@/app/_shared/user/_services/recordDate.service'

type HomeOpinionCardTone = 'gray' | 'white' | 'yellow'

type HomeOpinionCardProps = {
  className?: string
  opinion: UserOpinion
  showSampleLabel?: boolean
  tone: HomeOpinionCardTone
}

const TONE_CLASS_NAME: Record<HomeOpinionCardTone, string> = {
  yellow: 'bg-[#f7eecb] text-[#222222]',
  white: 'bg-bg-default text-[#222222]',
  gray: 'bg-[#404040] text-white',
}

const MUTED_TEXT_CLASS_NAME: Record<HomeOpinionCardTone, string> = {
  yellow: 'text-[#313131]/50',
  white: 'text-[#313131]/50',
  gray: 'text-white/50',
}

const DATE_TEXT_CLASS_NAME: Record<HomeOpinionCardTone, string> = {
  yellow: 'text-[#5b5b5b]',
  white: 'text-[#5b5b5b]',
  gray: 'text-white',
}

const DIVIDER_CLASS_NAME: Record<HomeOpinionCardTone, string> = {
  yellow: 'border-border-book/50',
  white: 'border-border-book/50',
  gray: 'border-white/50',
}

export function HomeOpinionCard({
  className,
  opinion,
  showSampleLabel = false,
  tone,
}: HomeOpinionCardProps) {
  return (
    <Link
      href={buildTraceTargetHref(opinion.bookId, {
        pageNumber: opinion.pageNumber,
        passageId: opinion.passageId,
        opinionId: opinion.opinionId,
      })}
      aria-label={`${opinion.bookTitle} ${String(opinion.pageNumber)}쪽 의견 보기`}
      className={cn(
        'press relative flex h-[260px] w-[200px] shrink-0 flex-col overflow-visible border border-border-book drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]',
        TONE_CLASS_NAME[tone],
        className,
      )}
    >
      {showSampleLabel && (
        <span
          aria-label="샘플 의견"
          className="absolute top-[-20px] -left-px z-10 bg-bg-dark px-3 py-2 font-pretendard text-[14px] leading-[1.2] font-semibold text-text-inverse"
        >
          SAMPLE
        </span>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="truncate font-pretendard text-[16px] leading-[1.4] font-bold tracking-[-0.32px]">
            {opinion.bookTitle}
          </h2>
          <p
            className={cn(
              'truncate font-pretendard text-[14px] leading-[1.3] font-medium tracking-[-0.28px]',
              MUTED_TEXT_CLASS_NAME[tone],
            )}
          >
            {opinion.author}
          </p>
        </div>

        <p className="line-clamp-5 min-h-0 font-pretendard text-[16px] leading-[1.4] font-medium tracking-[-0.32px]">
          {opinion.content}
        </p>
      </div>

      <div aria-hidden className={cn('border-t border-dashed', DIVIDER_CLASS_NAME[tone])} />

      <div className="flex items-center justify-between gap-3 p-4 font-pretendard text-[14px] leading-[1.3] font-medium tracking-[-0.28px]">
        <span>{opinion.pageNumber}p</span>
        <span className={cn('shrink-0', DATE_TEXT_CLASS_NAME[tone])}>
          {formatRecordedDate(opinion.createdAt)}
        </span>
      </div>
    </Link>
  )
}
