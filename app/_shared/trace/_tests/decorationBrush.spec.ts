import { describe, expect, it } from 'vitest'

import type { EffectType } from '../_data/decoration.model'
import { BRUSH_COLOR_PLACEHOLDER, BRUSH_SVG_BY_EFFECT } from '../_data/decorationBrush.constant'
import { DECORATION_COLORS } from '../_data/decorationColor.constant'
import { decorationBrushStyle } from '../_services/decorationBrush.service'

// 형광펜은 붓 자국이 아니라 반투명 띠라 붓 SVG를 쓰지 않는다
const BRUSH_EFFECT_TYPES: EffectType[] = ['CIRCLE', 'DOTTED', 'DOUBLE_LINE', 'UNDERLINE', 'WAVY']

const decoration = (effectType: EffectType, color: string) => ({
  color,
  effectType,
  endOffset: 5,
  startOffset: 0,
})

/** url("data:image/svg+xml,...") 에서 fill 색이 이 값으로 들어갔는지 본다. #은 %23으로 인코딩된다. */
const encodedFill = (color: string) => `fill='%23${color.slice(1).toLowerCase()}'`

describe('decorationBrushStyle', () => {
  it('모든 효과×팔레트 색 조합이 색이 채워진 data URI를 만든다', () => {
    for (const effectType of BRUSH_EFFECT_TYPES) {
      for (const color of DECORATION_COLORS) {
        const { backgroundImage } = decorationBrushStyle(decoration(effectType, color))
        expect(backgroundImage).toMatch(/^url\("data:image\/svg\+xml,/)
        expect(backgroundImage).toContain(encodedFill(color))
        expect(backgroundImage).not.toContain(BRUSH_COLOR_PLACEHOLDER)
      }
    }
  })

  it('붓 SVG 원본은 색 자리가 하나뿐이고 큰따옴표가 없다', () => {
    // 큰따옴표가 섞이면 CSS url("...")이 그 자리에서 끊긴다
    for (const svg of Object.values(BRUSH_SVG_BY_EFFECT)) {
      expect(svg.split(BRUSH_COLOR_PLACEHOLDER)).toHaveLength(2)
      expect(svg).not.toContain('"')
    }
  })

  it('팔레트에 없는 색은 기본색으로 떨어뜨린다', () => {
    // 예전 초안이나 서버가 준 값이 팔레트 밖일 수 있다. 모르는 색 대신 기본색으로 그린다.
    expect(decorationBrushStyle(decoration('WAVY', '#FFE08A')).backgroundImage).toContain(
      encodedFill('#ED6243'),
    )
  })

  it('형광펜은 붓 SVG 대신 반투명 띠를 깐다', () => {
    const style = decorationBrushStyle(decoration('HIGHLIGHT', '#FFA600'))
    expect(style.backgroundImage).toBeUndefined()
    expect(style.backgroundColor).toBe('color-mix(in srgb, #ffa600 40%, transparent)')
  })

  it('형광펜도 팔레트에 없는 색은 기본색으로 떨어뜨린다', () => {
    // 모르는 색을 그대로 넘기면 color-mix(...)가 무효해져 CSSOM이 선언을 통째로 버리고,
    // 하이라이트가 오류 없이 조용히 사라진다(#146)
    const style = decorationBrushStyle(decoration('HIGHLIGHT', 'not-a-color'))
    expect(style.backgroundColor).toBe('color-mix(in srgb, #ed6243 40%, transparent)')
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
