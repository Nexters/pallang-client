import type { DraftEffectType } from '../_types/traceDraft.type'

export type EffectOption = {
  key: string
  label: string
  /** null이면 API effectType enum에 대응 값이 없어 비활성이다. */
  effectType: DraftEffectType | null
  color: string
}

// 시안의 3×2 그리드 순서를 유지한다. 백엔드가 enum을 넓히면 effectType만 채우면 열린다.
export const EFFECT_OPTIONS: readonly EffectOption[] = [
  { key: 'highlight', label: '형광펜', effectType: 'HIGHLIGHT', color: '#FFE08A' },
  { key: 'wavy', label: '물결줄', effectType: 'WAVY', color: '#EF5A06' },
  { key: 'circle', label: '동그라미', effectType: null, color: '#EF5A06' },
  { key: 'pencil', label: '색연필', effectType: 'UNDERLINE', color: '#EF5A06' },
  { key: 'dotted', label: '점선', effectType: null, color: '#EF5A06' },
  { key: 'double', label: '겹줄', effectType: null, color: '#EF5A06' },
]
