import type { DraftEffectType } from '../_types/traceDraft.type'

export type EffectOption = {
  effectType: DraftEffectType
  key: 'circle' | 'dots' | 'highlight' | 'pencil' | 'underline' | 'wave'
  label: string
}

// 시안의 3×2 그리드 순서를 유지한다. key는 아이콘 에셋(effect-<key>.svg) 이름과 맞춘다.
// 라벨↔enum은 물결줄·형광펜·점선·동그라미가 이름 그대로 대응하고, 남는 겹줄이 DOUBLE_LINE,
// 색연필이 UNDERLINE이다. 색은 효과별로 고정하지 않고 적용 후 팔레트에서 고른다.
export const EFFECT_OPTIONS: readonly EffectOption[] = [
  { effectType: 'HIGHLIGHT', key: 'highlight', label: '형광펜' },
  { effectType: 'WAVY', key: 'wave', label: '물결줄' },
  { effectType: 'CIRCLE', key: 'circle', label: '동그라미' },
  { effectType: 'UNDERLINE', key: 'pencil', label: '색연필' },
  { effectType: 'DOTTED', key: 'dots', label: '점선' },
  { effectType: 'DOUBLE_LINE', key: 'underline', label: '겹줄' },
]
