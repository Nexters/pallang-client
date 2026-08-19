'use client'

import Link from 'next/link'
import { type ReactNode, useRef, useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { useIsOverflowing } from '@/app/_global/_hooks/useIsOverflowing'
import { cn } from '@/app/_global/_services/cn.service'

type RecordCardProps = {
  /** 머리줄 왼쪽 — 책 안의 쪽 번호 */
  pageNumber: number
  /**
   * 쪽수 옆 보조 텍스트. 좋아요 관리는 닉네임, 스포일러 관리는 작성일.
   * 책 상세 의견 탭은 쪽수 옆에 붙일 게 없어 생략한다 — 작성일은 오른쪽 끝이다.
   */
  meta?: string
  /** 점선 아래 본문. 좋아요 관리는 흔적 본문, 스포일러 관리는 대목 인용문이다. */
  body: string
  /**
   * 머리줄 오른쪽 끝 자리 하나(좋아요 하트 · `해제` 버튼 · 작성일 텍스트).
   * 화면마다 모양도 동작도 달라 카드가 알 필요가 없다 — 통째로 받아 자리만 내준다.
   */
  action?: ReactNode
  /** 카드를 덮는 이동 링크. 좌표를 만들 수 있는 화면만 넘긴다. */
  link?: { href: string; label: string }
  /**
   * 펼친 본문을 다시 접을 수 있는지. 책 상세 의견 탭에만 `접기` 자리가 있고
   * 관리 화면 두 곳(좋아요 · 스포일러)의 시안에는 없어 기본은 한 방향이다.
   */
  collapsible?: boolean
}

/**
 * 마이페이지 관리 목록(좋아요 관리 · 스포일러 관리)의 카드 하나.
 * 표지 없이 `{쪽수}p · 보조 텍스트` 머리줄 + 점선 + 본문만 담고,
 * 두 화면이 갈리는 자리(보조 텍스트·우측 액션·이동 링크)는 값과 slot으로 받는다.
 */
export function RecordCard({
  pageNumber,
  meta,
  body,
  action,
  link,
  collapsible = false,
}: RecordCardProps) {
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)
  // 펼치면 넘칠 일이 없어 관찰을 끈다 — 켜 둔 채 다시 재면 `더보기`가 사라진다.
  // 끄는 동안 마지막 측정값은 그대로 남아, 다시 접으면 관찰이 되살아나며 새로 잰다.
  const overflowing = useIsOverflowing({ targetRef: contentRef, enabled: !expanded })
  const toggleVisible = overflowing && (collapsible || !expanded)

  return (
    <article className="relative flex flex-col gap-4 border border-border-book bg-bg-default p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-body-14md">
          <span className="shrink-0 text-label-strong">{pageNumber}p</span>
          {meta !== undefined && <span className="truncate text-text-tertiary">{meta}</span>}
        </div>
        {/* 카드를 덮는 링크 위로 띄운다 — 액션 쪽은 링크를 모른 채 자기 모양만 그린다 */}
        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </div>

      {/* 머리줄과 본문을 가르는 점선 — SVG 대신 CSS라 카드 너비를 따라 늘어난다 */}
      <div aria-hidden className="border-t border-dashed border-border-book" />

      <div className="flex flex-col items-end gap-1">
        <p
          ref={contentRef}
          // 접힌 본문은 세 줄까지만 보인다
          className={cn('w-full text-body-16md text-text-secondary', !expanded && 'line-clamp-3')}
        >
          {body}
        </p>
        {/* `collapsible`이 아닌 화면은 되돌리는 자리가 시안에 없어 한 번 펼치면 그대로 둔다 */}
        {toggleVisible && (
          <button
            type="button"
            onClick={() => {
              setExpanded((previous) => !previous)
            }}
            className="relative z-10 flex items-center gap-0.5 px-2 py-1 text-body-14rg text-text-primary press"
          >
            {expanded ? '접기' : '더보기'}
            {/* Tailwind v4에서 rotate-*는 rotate 속성이라 transition-transform으로만 잡힌다 */}
            <ChevronDownIcon
              width={20}
              height={20}
              className={cn(
                'size-5 text-icon-primary transition-transform duration-instant ease-standard',
                expanded && 'rotate-180',
              )}
            />
          </button>
        )}
      </div>

      {/* 시안 카드에는 이동 어피던스가 없지만, 기존 화면처럼 카드를 눌러 그 흔적으로 갈 수 있어야 한다.
          카드를 덮는 링크로 두고 액션·더보기만 z-10으로 위에 띄운다 — 링크 안에 버튼을 넣으면 안 된다. */}
      {link && <Link href={link.href} aria-label={link.label} className="absolute inset-0" />}
    </article>
  )
}
