import { readdirSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { DECORATION_COLORS } from '../_data/decorationColor.constant'
import { decorationBrushStyle } from '../_services/decorationBrush.service'
import type { DraftEffectType } from '../_types/traceDraft.type'

const EFFECT_TYPES: DraftEffectType[] = [
  'CIRCLE',
  'DOTTED',
  'DOUBLE_LINE',
  'HIGHLIGHT',
  'UNDERLINE',
  'WAVY',
]

const decoration = (effectType: DraftEffectType, color: string) => ({
  color,
  effectType,
  endOffset: 5,
  startOffset: 0,
})

describe('decorationBrushStyle', () => {
  it('모든 효과×팔레트 색 조합이 실제 파일을 가리킨다', () => {
    const files = new Set(readdirSync('public/decorations'))

    for (const effectType of EFFECT_TYPES) {
      for (const color of DECORATION_COLORS) {
        const { backgroundImage } = decorationBrushStyle(decoration(effectType, color))
        const name = /url\(\/decorations\/(.+?)\)/.exec(backgroundImage ?? '')?.[1]
        expect(files, `${effectType} / ${color} → ${String(name)}`).toContain(name)
      }
    }
  })

  it('팔레트에 없는 색은 기본색 파일로 떨어뜨린다', () => {
    // 예전 초안이나 서버가 준 값이 팔레트 밖일 수 있다. 404 대신 기본색을 쓴다.
    expect(decorationBrushStyle(decoration('WAVY', '#FFE08A')).backgroundImage).toBe(
      'url(/decorations/wave-ed6243.svg)',
    )
  })

  it('점선만 반복해 깔고 나머지는 한 번만 그린다', () => {
    expect(decorationBrushStyle(decoration('DOTTED', '#ED6243')).backgroundRepeat).toBe('repeat-x')
    expect(decorationBrushStyle(decoration('WAVY', '#ED6243')).backgroundRepeat).toBe('no-repeat')
  })
})
