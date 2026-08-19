'use client'

import { Select as BaseSelect } from '@base-ui/react/select'
import { Fragment, useState } from 'react'

import ChevronDownIcon from '@/app/_global/_components/Icon/assets/chevron-down.svg'
import { cn } from '@/app/_global/_services/cn.service'

// 정렬 필터(최신순/인기순) Select.
// 닫혀 있을 땐 배경 없는 알약, 열리면 트리거가 그대로 첫 줄이 되는 radius 8 블록이다.
// 얹히는 면에 따라 tone이 갈린다(dark: 채운 회색 / light: 유리) — 시안의 네 변형이 이 둘 × 열림 상태다.
// 열림 모션·이음매 처리는 헤더의 PagePicker와 같은 규약을 따른다(트리거가 아래 모서리를 펴고,
// 목록은 origin-top으로 세로만 눌러 펼친다) — 두 드롭다운이 같은 몸짓으로 열려야 한다.
// Dialog.tsx와 같은 base-ui 서브패스 import + `render` prop 규약을 따른다.

// 트리거·옵션 타이포는 Figma 스펙(14px / lh 1.3 / ls -4% / Regular)이 --text-body-14rg와 정확히 일치한다.
const TEXT_CLASS = 'font-pretendard text-body-14rg'
/** 줄 하나 높이는 6+18+6=30px — 트리거와 옵션이 같은 리듬으로 쌓여야 한 덩어리로 읽힌다 */
const ROW_CLASS = 'flex items-center px-2 py-1.5 whitespace-nowrap'
/** 항목을 가르는 점선(Figma: 좌우 10px 안쪽) — SVG 대신 CSS라 너비가 바뀌어도 따라 늘어난다 */
const RULE_CLASS = 'mx-2.5 border-t border-dashed'

// 시안의 네 변형은 (닫힘·열림) × (어두운 면·밝은 면)이다. 상태는 data-popup-open이 가르고,
// 면에 따라 갈리는 색만 여기 묶는다. 열린 블록의 면은 톤마다 아예 다르다 —
// dark는 채운 회색(Background/Gray #323232 = --color-bg-gray), light는 유리(검정 10% + blur 9)다.
const TONE_CLASS = {
  dark: {
    text: 'text-text-inverse',
    icon: 'text-icon-active',
    triggerOpen: 'data-popup-open:bg-bg-gray',
    surface: 'bg-bg-gray',
    rule: 'border-white/10',
  },
  light: {
    text: 'text-text-primary',
    icon: 'text-icon-primary',
    triggerOpen: 'data-popup-open:bg-black/10 data-popup-open:backdrop-blur-[9px]',
    surface: 'bg-black/10 backdrop-blur-[9px]',
    rule: 'border-black/10',
  },
} as const

type SelectOption<TValue extends string> = { label: string; value: TValue }

type SelectProps<TValue extends string> = {
  /** 트리거의 접근성 이름. 시각적 라벨이 없는 컴팩트 셀렉트라 필수다. */
  label: string
  options: readonly SelectOption<TValue>[]
  /** controlled로 쓸 때 지정한다. */
  value?: TValue
  /** uncontrolled 초기값. 없으면 첫 옵션이 아니라 빈 값으로 시작한다. */
  defaultValue?: TValue
  onValueChange?: (value: TValue) => void
  disabled?: boolean
  /** 얹히는 면. 어두운 사진·배경 위면 'dark', 밝은 면 위면 'light'(유리 질감)다. */
  tone?: keyof typeof TONE_CLASS
  className?: string
}

export function Select<TValue extends string>({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  tone = 'dark',
  className,
}: SelectProps<TValue>) {
  const toneClass = TONE_CLASS[tone]
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const currentValue = value ?? uncontrolledValue
  const visibleOptions = options.filter((option) => option.value !== currentValue)

  return (
    <BaseSelect.Root<TValue>
      items={options}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={(nextValue) => {
        // 값 해제(null)는 이 셀렉트에서 일어나지 않지만 타입상 올 수 있어 막아둔다.
        if (nextValue === null) return
        setUncontrolledValue(nextValue)
        onValueChange?.(nextValue)
      }}
    >
      <BaseSelect.Trigger
        aria-label={label}
        data-slot="select-trigger"
        className={cn(
          ROW_CLASS,
          // 알약이지만 rounded-full은 쓰지 않는다 — Tailwind v4에서 calc(infinity*1px)이라
          // 각진 모서리로 전환할 때 거의 끝까지 알약으로 버티다 툭 끊긴다. 높이(30px)의 절반을 직접 준다.
          'w-fit cursor-pointer gap-0.5 rounded-[15px]',
          // 배경 없이 뒤 이미지만 살짝 흐리게 눌러 텍스트 가독성을 확보한다(Figma: fill 없음 + blur 1)
          'backdrop-blur-[1px] outline-none disabled:cursor-not-allowed disabled:opacity-50',
          // 열리면 아래 목록과 한 덩어리로 이어져야 해서 알약을 각진 radius 8로 펴고 아래 모서리를 없앤다.
          // 모서리는 목록이 붙어 있는 동안 각져 있어야 한다 — 알약 반지름이 남은 채 목록이 닿으면
          // 이음매 양쪽이 옴폭 파여 보인다. 그래서 열 때는 delay 없이 바로 펴고(duration-instant),
          // 닫을 때는 목록이 다 사라진 뒤(delay = 퇴장 시간)에야 알약으로 되돌린다.
          // (화살표의 transition-transform은 자식인 Icon에 걸려 있어 여기 transition-property와 겹치지 않는다)
          'transition-[border-radius,background-color] duration-instant ease-standard',
          'delay-(--duration-fast) data-popup-open:delay-0',
          'data-popup-open:rounded-t-[8px] data-popup-open:rounded-b-none',
          toneClass.triggerOpen,
          TEXT_CLASS,
          toneClass.text,
          className,
        )}
      >
        <BaseSelect.Value data-slot="select-value" />
        {/* base-ui 기본 children이 '▼' 텍스트라 반드시 children을 넘겨 덮어써야 한다 */}
        <BaseSelect.Icon
          data-slot="select-icon"
          className="flex size-4 shrink-0 items-center justify-center transition-transform duration-fast ease-standard data-popup-open:rotate-180"
        >
          <ChevronDownIcon width={16} height={16} className={cn('size-4', toneClass.icon)} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        {/* Figma 열림 상태는 트리거를 그대로 두고 옵션 목록만 아래로 펼친다. */}
        <BaseSelect.Positioner
          data-slot="select-positioner"
          alignItemWithTrigger={false}
          sideOffset={0}
          align="end"
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            data-slot="select-popup"
            className={cn(
              'min-w-(--anchor-width) rounded-t-none rounded-b-[8px] outline-none',
              // 옵션 수가 서버에서 오는 목록(도서 필터 등)은 화면을 넘길 수 있다 —
              // 트리거 아래 남은 높이까지만 펼치고 그 안에서 스크롤한다.
              'scrollbar-none max-h-(--available-height) overflow-y-auto overscroll-contain',
              toneClass.surface,
              // 트리거 아래로 펼쳐지고 다시 접히는 모션 — 세로로만 눌러 두 요소가 한 덩어리로 붙어 보이게 한다.
              // Tailwind v4의 scale-*는 transform이 아니라 scale 속성이라 전환 목록에 scale을 직접 적어야 먹는다
              'origin-top transition-[opacity,scale] duration-fast ease-enter',
              'data-starting-style:scale-y-95 data-starting-style:opacity-0',
              'data-ending-style:scale-y-95 data-ending-style:opacity-0 data-ending-style:ease-exit',
              TEXT_CLASS,
              toneClass.text,
            )}
          >
            {visibleOptions.map((option) => (
              <Fragment key={option.value}>
                {/* 첫 점선은 트리거와 목록 사이 이음매다 — 옵션마다 앞에 두면 간격이 한 규칙으로 맞는다 */}
                <div aria-hidden className={cn(RULE_CLASS, toneClass.rule)} />
                <BaseSelect.Item
                  value={option.value}
                  data-slot="select-item"
                  className={cn(ROW_CLASS, 'cursor-pointer justify-center outline-none')}
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              </Fragment>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
