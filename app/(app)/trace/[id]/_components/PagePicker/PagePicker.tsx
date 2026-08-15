'use client'

import { Select as BaseSelect } from '@base-ui/react/select'
import { useRef, useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'
import { cn } from '@/app/_global/_services/cn.service'

type PagePickerProps = {
  pages: number[]
  activePage: number | undefined
  onSelect: (page: number) => void
  /** 더 불러올 페이지 목록이 있을 때만 전달한다 — 목록 끝까지 스크롤하면 호출된다 */
  onLoadMore?: () => void
}

/** 트리거와 열린 목록이 하나의 알약으로 이어져 보여야 해서 유리 질감은 두 곳이 똑같이 쓴다 */
const GLASS = 'bg-black/10 backdrop-blur-[9px]'
/** 항목을 가르는 점선 — SVG 대신 CSS 테두리라 목록 너비가 바뀌어도 따라 늘어난다 */
const DASHED_RULE = 'border-t border-dashed border-black/10'

/** 헤더의 쪽 선택(디자인 202:7776의 상단 탭).
    가로 탭 줄을 대신하므로 페이지 수가 많아도 열리는 목록 안에서 이어 불러온다. */
export function PagePicker({ pages, activePage, onSelect, onLoadMore }: PagePickerProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useLoadMoreOnVisible({
    targetRef: loadMoreRef,
    rootRef: popupRef,
    enabled: onLoadMore !== undefined,
    onLoadMore: () => {
      onLoadMore?.()
    },
  })

  const currentPage = activePage ?? pages[0]
  // 목록에서 뺄 쪽 — 고른 순간 현재 쪽을 따라가면 퇴장 전환 중에 줄이 통째로 갈려 툭 끊겨 보인다.
  // 그래서 기준은 열 때만 갱신하고, 닫히는 180ms 동안은 방금 고른 줄이 그 자리에 남는다
  const [listAnchorPage, setListAnchorPage] = useState(currentPage)
  // 열린 목록에는 현재 쪽을 빼고 담는다 — 현재 쪽은 목록 맨 위에 트리거로 이미 서 있다
  const otherPages = pages.filter((page) => page !== currentPage)
  const listPages = pages.filter((page) => page !== listAnchorPage)

  // 고를 쪽이 없으면 펼칠 것도 없다 — 화살표 없는 알약으로만 세운다(디자인 202:7777)
  if (otherPages.length === 0) {
    if (currentPage === undefined) return null

    return (
      <span
        className={cn(
          'flex shrink-0 items-center rounded-[8px] px-3 py-2',
          GLASS,
          'font-pretendard text-body-14sb whitespace-nowrap text-text-primary',
        )}
      >
        {currentPage}p
      </span>
    )
  }

  return (
    <BaseSelect.Root<string>
      // 라벨은 렌더된 항목이 아니라 이 목록에서 찾는다 — 현재 쪽을 빼고 그려도 트리거 표시는 그대로다
      items={pages.map((page) => ({ label: `${String(page)}p`, value: String(page) }))}
      value={activePage === undefined ? null : String(activePage)}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onSelect(Number(nextValue))
      }}
      onOpenChange={(nextOpen) => {
        // 목록을 새로 세울 때만 기준 쪽을 맞춘다 — 닫는 쪽에서 건드리면 퇴장 중에 줄이 갈린다
        if (nextOpen) setListAnchorPage(currentPage)
      }}
    >
      <BaseSelect.Trigger
        aria-label="쪽 선택"
        className={cn(
          'flex shrink-0 cursor-pointer items-center gap-1 rounded-[8px] px-3 py-2',
          GLASS,
          'font-pretendard text-body-14sb text-text-primary outline-none',
          // 열리면 아래 목록과 한 덩어리로 이어져야 해서 아래 모서리를 편다.
          // 모서리도 전환을 태운다 — 닫는 순간 각지게 튀면 아직 사라지는 중인 목록과 이음매가 툭 끊긴다.
          // (화살표의 transition-transform은 자식인 Icon에 걸려 있어 여기 transition-property와 겹치지 않는다)
          'transition-[border-radius] duration-fast ease-standard data-popup-open:rounded-b-none',
        )}
      >
        <BaseSelect.Value className="whitespace-nowrap" />
        {/* base-ui 기본 children이 '▼' 텍스트라 반드시 children을 넘겨 덮어써야 한다 */}
        <BaseSelect.Icon className="flex size-4 shrink-0 items-center justify-center transition-transform duration-fast ease-standard data-popup-open:rotate-180">
          <ChevronDownIcon width={16} height={16} className="size-4 text-icon-primary" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          sideOffset={0}
          align="end"
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            ref={popupRef}
            className={cn(
              'max-h-60 min-w-(--anchor-width) overflow-y-auto rounded-t-none rounded-b-[8px]',
              GLASS,
              // 트리거와 목록 사이의 점선 — 스크롤해도 자리를 지키도록 목록 상자에 건다
              DASHED_RULE,
              'font-pretendard text-body-14sb text-text-primary outline-none',
              // 트리거 아래로 펼쳐지고 다시 접히는 모션 — 세로로만 눌러 두 요소가 한 알약으로 붙어 보이게 한다.
              // Tailwind v4의 scale-*는 transform이 아니라 scale 속성이라 전환 목록에 scale을 직접 적어야 먹는다
              'origin-top transition-[opacity,scale] duration-fast ease-enter',
              'data-starting-style:scale-y-95 data-starting-style:opacity-0',
              'data-ending-style:scale-y-95 data-ending-style:opacity-0 data-ending-style:ease-exit',
            )}
          >
            {listPages.map((page, index) => (
              <BaseSelect.Item
                key={page}
                value={String(page)}
                className={cn(
                  'flex cursor-pointer items-center justify-center px-3 py-2 whitespace-nowrap outline-none',
                  // 첫 항목 위 점선은 목록 상자가 이미 그리고 있다
                  index > 0 && DASHED_RULE,
                )}
              >
                <BaseSelect.ItemText>{page}p</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
            {/* 목록 끝 sentinel — 보이면 다음 쪽 묶음을 이어 붙인다 */}
            <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
