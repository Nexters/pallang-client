'use client'

import type { FC, SVGProps } from 'react'

import EffectDotsIcon from '@/app/_global/_components/Icon/assets/effect-dots.svg'
import EffectHighlightIcon from '@/app/_global/_components/Icon/assets/effect-highlight.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { EFFECT_OPTIONS, type EffectOption } from '../../_data/effect.constant'

type EffectPickerProps = {
  disabled: boolean
  onPick: (option: EffectOption) => void
  /** 고른 효과. 활성으로 표시한다. */
  selectedKey?: EffectOption['key'] | null
}

// 동그라미·색연필·점선 아이콘 등 붓 자국이 든 4종은 스탬프 반복 수백 개짜리 벡터(57.7KB)라
// 표시 크기(30px)의 3배 래스터로 대체했다(#322) — 색이 에셋에 박힌 일러스트라 currentColor가
// 필요 없다. 점선·형광펜은 단순 벡터(각 350B)라 SVG를 유지한다.
const svgIconByKey: Partial<Record<EffectOption['key'], FC<SVGProps<SVGSVGElement>>>> = {
  dots: EffectDotsIcon,
  highlight: EffectHighlightIcon,
}

export function EffectPicker({ disabled, onPick, selectedKey }: EffectPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-2">
      {EFFECT_OPTIONS.map((option) => {
        const SvgIcon = svgIconByKey[option.key]
        const isSelected = option.key === selectedKey
        return (
          <button
            key={option.key}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => {
              onPick(option)
            }}
            className={cn(
              'press flex cursor-pointer flex-col items-center rounded-2xl bg-bg-gray p-3.5 text-body-14md text-text-inverse backdrop-blur-[1px]',
              // 시안(꾸미기 버튼 클릭) — 누르는 동안 흰 배경에 진한 글자로 뒤집힌다.
              // 아이콘은 에셋에 색이 박혀 있어(효과 오렌지 + A 회색) 양쪽 상태에서 그대로 쓴다.
              'active:bg-bg-default active:text-text-primary',
              // 고른 효과는 누르는 동안과 같은 반전 스타일로 계속 활성 표시한다
              isSelected && 'bg-bg-default text-text-primary',
              disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {SvgIcon ? (
              <SvgIcon aria-hidden="true" className="size-[30px]" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- 30px 고정 크기 로컬 에셋이라 next/image 최적화가 붙을 자리가 없다
              <img
                aria-hidden="true"
                alt=""
                src={`/images/effects/effect-${option.key}.webp`}
                width={30}
                height={30}
                className="size-[30px]"
              />
            )}
            {/* 고른 효과는 라벨까지 굵어진다(시안 I3082:36368;2200:14222) */}
            <span className={cn('w-full text-center', isSelected && 'text-title-14bd')}>
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
