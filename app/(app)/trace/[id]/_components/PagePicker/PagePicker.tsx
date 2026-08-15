'use client'

import { Select as BaseSelect } from '@base-ui/react/select'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { DASHED_RULE, GLASS_SURFACE, PAGE_LIST_MAX_HEIGHT } from '../../_data/stage.constant'
import { usePagePicker } from '../../_hooks/usePagePicker'
import {
  formatPageLabel,
  parsePageValue,
  toPageOptions,
  toPageValue,
  toSelectedValue,
} from '../../_services/pageOption.service'
import type { PageNav } from '../../_types/readerHighlights.type'

/** 헤더의 쪽 선택(디자인 202:7776의 상단 탭).
    가로 탭 줄을 대신하므로 페이지 수가 많아도 열리는 목록 안에서 이어 불러온다. */
export function PagePicker(nav: PageNav) {
  const { popupRef, loadMoreRef, currentPage, otherPages, listPages, syncListAnchor } =
    usePagePicker(nav)

  // 고를 쪽이 없으면 펼칠 것도 없다 — 화살표 없는 알약으로만 세운다(디자인 202:7777)
  if (otherPages.length === 0) {
    if (currentPage === undefined) return null

    return (
      <span
        className={cn(
          'flex shrink-0 items-center rounded-[8px] px-3 py-2',
          GLASS_SURFACE,
          'font-pretendard text-body-14sb whitespace-nowrap text-text-primary',
        )}
      >
        {formatPageLabel(currentPage)}
      </span>
    )
  }

  return (
    <BaseSelect.Root<string>
      items={toPageOptions(nav.pages)}
      value={toSelectedValue(nav.activePage)}
      onValueChange={(nextValue) => {
        if (nextValue !== null) nav.onSelectPage(parsePageValue(nextValue))
      }}
      onOpenChange={syncListAnchor}
    >
      <BaseSelect.Trigger
        aria-label="쪽 선택"
        className={cn(
          'flex shrink-0 cursor-pointer items-center gap-1 rounded-[8px] px-3 py-2',
          GLASS_SURFACE,
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
              PAGE_LIST_MAX_HEIGHT,
              'min-w-(--anchor-width) overflow-y-auto rounded-t-none rounded-b-[8px]',
              GLASS_SURFACE,
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
                value={toPageValue(page)}
                className={cn(
                  'flex cursor-pointer items-center justify-center px-3 py-2 whitespace-nowrap outline-none',
                  // 첫 항목 위 점선은 목록 상자가 이미 그리고 있다
                  index > 0 && DASHED_RULE,
                )}
              >
                <BaseSelect.ItemText>{formatPageLabel(page)}</BaseSelect.ItemText>
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
