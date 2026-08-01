import { readdirSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { EffectType } from '../_data/decoration.model'
import { DECORATION_COLORS } from '../_data/decorationColor.constant'
import { decorationBrushStyle } from '../_services/decorationBrush.service'

// 형광펜은 붓 자국이 아니라 반투명 띠라 파일을 쓰지 않는다
const BRUSH_EFFECT_TYPES: EffectType[] = ['CIRCLE', 'DOTTED', 'DOUBLE_LINE', 'UNDERLINE', 'WAVY']

const decoration = (effectType: EffectType, color: string) => ({
  color,
  effectType,
  endOffset: 5,
  startOffset: 0,
})

describe('decorationBrushStyle', () => {
  it('모든 효과×팔레트 색 조합이 실제 파일을 가리킨다', () => {
    const files = new Set(readdirSync('public/decorations'))

    for (const effectType of BRUSH_EFFECT_TYPES) {
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

  it('형광펜은 붓 파일 대신 반투명 띠를 깐다', () => {
    const style = decorationBrushStyle(decoration('HIGHLIGHT', '#FFA600'))
    expect(style.backgroundImage).toBeUndefined()
    expect(style.backgroundColor).toBe('color-mix(in srgb, #FFA600 40%, transparent)')
  })

  it('동그라미만 배경 영역을 사방으로 넓힌다', () => {
    const circle = decorationBrushStyle(decoration('CIRCLE', '#ED6243'))
    expect(circle.paddingBlock).toBe('0.3em')
    expect(circle.paddingInline).toBe('0.7em')
    // 가로는 같은 크기의 음수 마진으로 상쇄해야 글자가 밀리지 않는다
    expect(circle.marginInline).toBe(`-${String(circle.paddingInline)}`)

    const wavy = decorationBrushStyle(decoration('WAVY', '#ED6243'))
    expect(wavy.paddingBlock).toBeUndefined()
    expect(wavy.paddingInline).toBeUndefined()
  })

  it('점선만 반복해 깔고 나머지는 한 번만 그린다', () => {
    expect(decorationBrushStyle(decoration('DOTTED', '#ED6243')).backgroundRepeat).toBe('repeat-x')
    expect(decorationBrushStyle(decoration('WAVY', '#ED6243')).backgroundRepeat).toBe('no-repeat')
  })
})
