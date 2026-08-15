'use client'

import { Select as BaseSelect } from '@base-ui/react/select'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { cn } from '@/app/_global/_services/cn.service'

// Figma 2248:3301 — 정렬 필터(최신순/인기순) Select.
// 컴팩트 셀렉트라 트리거는 배경 없이 blur만 둔다. 어두운 이미지 위에서는 dark, 흰 목록 위에서는 light를 쓴다.
// Dialog.tsx와 같은 base-ui 서브패스 import + `render` prop 규약을 따른다.

// 트리거·옵션 타이포는 Figma 스펙(14px / lh 1.3 / ls -4% / Regular)이 --text-body-14rg와 정확히 일치한다.
// 팝업 배경 #383838도 --color-bg-overlay와 일치해 토큰을 그대로 쓴다.
const BASE_TEXT_CLASS = 'font-pretendard text-body-14rg'

type SelectOption = { label: string; value: string }
type SelectVariant = 'dark' | 'light'

type SelectProps = {
  /** 트리거의 접근성 이름. 시각적 라벨이 없는 컴팩트 셀렉트라 필수다. */
  label: string
  options: readonly SelectOption[]
  /** controlled로 쓸 때 지정한다. */
  value?: string
  /** uncontrolled 초기값. 없으면 첫 옵션이 아니라 빈 값으로 시작한다. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  variant?: SelectVariant
  className?: string
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  variant = 'dark',
  className,
}: SelectProps) {
  const isLight = variant === 'light'

  return (
    <BaseSelect.Root<string>
      items={options}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        // 값 해제(null)는 이 셀렉트에서 일어나지 않지만 타입상 올 수 있어 막아둔다.
        if (nextValue !== null) onValueChange?.(nextValue)
      }}
    >
      <BaseSelect.Trigger
        aria-label={label}
        data-slot="select-trigger"
        className={cn(
          'flex h-8 w-fit cursor-pointer items-center gap-0.5 rounded-full px-2 py-1',
          // 배경 없이 뒤를 살짝 흐리게 눌러 텍스트 가독성을 확보한다(Figma: fill 없음 + blur 1)
          'backdrop-blur-[1px] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          isLight
            ? 'text-text-primary data-popup-open:bg-bg-default'
            : 'text-text-inverse data-popup-open:rounded-none data-popup-open:bg-bg-overlay',
          BASE_TEXT_CLASS,
          className,
        )}
      >
        <BaseSelect.Value data-slot="select-value" className="whitespace-nowrap" />
        {/* base-ui 기본 children이 '▼' 텍스트라 반드시 children을 넘겨 덮어써야 한다 */}
        <BaseSelect.Icon
          data-slot="select-icon"
          className="flex size-5 shrink-0 items-center justify-center transition-transform duration-fast ease-standard data-popup-open:rotate-180"
        >
          <ChevronDownIcon
            width={20}
            height={20}
            className={cn('size-5', isLight ? 'text-icon-primary' : 'text-text-inverse')}
          />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        {/* Figma 열림 상태는 트리거 행(값 + 위쪽 쉐브론)이 그대로 보이고 그 아래로 옵션이
            이어지는 한 덩어리 블록이다 — 팝업이 트리거를 덮지 않도록 겹침을 끈다. */}
        <BaseSelect.Positioner
          data-slot="select-positioner"
          alignItemWithTrigger={false}
          sideOffset={0}
          align="start"
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            data-slot="select-popup"
            className={cn(
              'min-w-(--anchor-width) outline-none',
              'transition-opacity duration-fast ease-enter data-ending-style:ease-exit',
              'data-ending-style:opacity-0 data-starting-style:opacity-0',
              isLight
                ? 'rounded-2xl bg-bg-default py-1 text-text-primary shadow-[0_4px_16px_rgba(0,0,0,0.16)]'
                : 'bg-bg-overlay text-text-inverse',
              BASE_TEXT_CLASS,
            )}
          >
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                data-slot="select-item"
                className="flex h-8 cursor-pointer items-center px-2 py-1 whitespace-nowrap outline-none"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
