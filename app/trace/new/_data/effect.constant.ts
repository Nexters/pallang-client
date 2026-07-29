import type { DraftEffectType } from '../_types/traceDraft.type'

export type EffectOption = {
  color: string
  /** null이면 API effectType enum에 대응 값이 없어 비활성이다. */
  effectType: DraftEffectType | null
  key: 'circle' | 'dots' | 'highlight' | 'pencil' | 'underline' | 'wave'
  label: string
}

// 시안의 3×2 그리드 순서를 유지한다. key는 아이콘 에셋(effect-<key>.svg) 이름과 맞춘다.
// 백엔드 enum이 UNDERLINE·WAVY·HIGHLIGHT 셋뿐이라 나머지 셋은 effectType이 비어 있다.
export const EFFECT_OPTIONS: readonly EffectOption[] = [
  { color: '#FFE08A', effectType: 'HIGHLIGHT', key: 'highlight', label: '형광펜' },
  { color: '#EF5A06', effectType: 'WAVY', key: 'wave', label: '물결줄' },
  { color: '#EF5A06', effectType: null, key: 'circle', label: '동그라미' },
  { color: '#EF5A06', effectType: null, key: 'pencil', label: '색연필' },
  { color: '#EF5A06', effectType: null, key: 'dots', label: '점선' },
  { color: '#EF5A06', effectType: 'UNDERLINE', key: 'underline', label: '겹줄' },
]
