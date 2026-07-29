'use client'

import type { FC, SVGProps } from 'react'

import EffectCircleIcon from '@/app/_global/_components/Icon/assets/effect-circle.svg'
import EffectDotsIcon from '@/app/_global/_components/Icon/assets/effect-dots.svg'
import EffectHighlightIcon from '@/app/_global/_components/Icon/assets/effect-highlight.svg'
import EffectPencilIcon from '@/app/_global/_components/Icon/assets/effect-pencil.svg'
import EffectUnderlineIcon from '@/app/_global/_components/Icon/assets/effect-underline.svg'
import EffectWaveIcon from '@/app/_global/_components/Icon/assets/effect-wave.svg'
import { cn } from '@/app/_global/_services/cn.service'

import { EFFECT_OPTIONS, type EffectOption } from '../../_data/effect.constant'

type EffectPickerProps = {
  disabled: boolean
  onPick: (option: EffectOption) => void
}

const iconByKey: Record<EffectOption['key'], FC<SVGProps<SVGSVGElement>>> = {
  circle: EffectCircleIcon,
  dots: EffectDotsIcon,
  highlight: EffectHighlightIcon,
  pencil: EffectPencilIcon,
  underline: EffectUnderlineIcon,
  wave: EffectWaveIcon,
}

export function EffectPicker({ disabled, onPick }: EffectPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-2">
      {EFFECT_OPTIONS.map((option) => {
        const Icon = iconByKey[option.key]
        const isDisabled = disabled || option.effectType === null
        return (
          <button
            key={option.key}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              onPick(option)
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center rounded-2xl bg-bg-gray p-3.5 text-body-14md text-text-inverse backdrop-blur-[1px]',
              isDisabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <Icon aria-hidden="true" className="size-[30px]" />
            <span className="w-full text-center">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
