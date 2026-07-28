'use client'

import { cn } from '@/app/_global/_services/cn.service'

import { EFFECT_OPTIONS, type EffectOption } from '../../_data/effect.constant'

type EffectPickerProps = {
  onPick: (option: EffectOption) => void
  disabled: boolean
}

export function EffectPicker({ onPick, disabled }: EffectPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {EFFECT_OPTIONS.map((option) => {
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
              'flex flex-col items-center gap-2 rounded-lg bg-bg-gray py-4 text-caption-12rg text-text-inverse',
              isDisabled && 'opacity-40',
            )}
          >
            <span aria-hidden="true" className="text-title-18sb" style={{ color: option.color }}>
              A
            </span>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
