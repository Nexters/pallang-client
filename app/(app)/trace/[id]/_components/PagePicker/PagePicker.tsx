'use client'

import { Select as BaseSelect } from '@base-ui/react/select'
import { useRef } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { useLoadMoreOnVisible } from '@/app/_global/_hooks/useLoadMoreOnVisible'

type PagePickerProps = {
  pages: number[]
  activePage: number | undefined
  onSelect: (page: number) => void
  /** 더 불러올 페이지 목록이 있을 때만 전달한다 — 목록 끝까지 스크롤하면 호출된다 */
  onLoadMore?: () => void
}

/** 헤더의 쪽 선택(디자인 200:977의 Tab_Menu_Item).
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

  return (
    <BaseSelect.Root<string>
      items={pages.map((page) => ({ label: `${String(page)}p`, value: String(page) }))}
      value={activePage === undefined ? null : String(activePage)}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onSelect(Number(nextValue))
      }}
    >
      <BaseSelect.Trigger
        aria-label="쪽 선택"
        className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-bg-default px-3 font-pretendard text-body-14sb text-text-primary outline-none"
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
          sideOffset={4}
          align="end"
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            ref={popupRef}
            className="max-h-60 min-w-(--anchor-width) overflow-y-auto rounded-2xl bg-bg-default py-1 font-pretendard text-body-14sb text-text-primary shadow-[0_4px_16px_rgba(0,0,0,0.16)] outline-none transition-opacity duration-fast ease-enter data-ending-style:opacity-0 data-ending-style:ease-exit data-starting-style:opacity-0"
          >
            {pages.map((page) => (
              <BaseSelect.Item
                key={page}
                value={String(page)}
                className="flex h-8 cursor-pointer items-center justify-center px-3 whitespace-nowrap outline-none data-selected:bg-bg-surface"
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
