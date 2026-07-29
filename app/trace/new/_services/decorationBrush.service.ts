import type { CSSProperties } from 'react'

import { DECORATION_COLORS, DEFAULT_DECORATION_COLOR } from '../_data/decorationColor.constant'
import type { DraftDecoration, DraftEffectType } from '../_types/traceDraft.type'

/**
 * 효과 자국은 시안 아이콘에서 뽑은 붓 벡터를 글자 뒤에 배경으로 깐다.
 * mask로 칠하면 글자까지 같이 잘려서, 팔레트 색마다 미리 만든 파일을 쓴다.
 */
const BRUSH_BY_EFFECT: Record<DraftEffectType, string> = {
  CIRCLE: 'circle',
  DOTTED: 'dots',
  DOUBLE_LINE: 'underline',
  HIGHLIGHT: 'highlight',
  UNDERLINE: 'pencil',
  WAVY: 'wave',
}

/** 글자를 감싸는 효과는 칸 전체로 늘이고, 밑줄 계열은 아랫단에 정해진 높이로 깐다. */
const LAYOUT_BY_EFFECT: Record<
  DraftEffectType,
  Pick<CSSProperties, 'backgroundPosition' | 'backgroundRepeat' | 'backgroundSize'>
> = {
  CIRCLE: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  },
  // 점은 늘이면 타원이 된다. 일정 간격으로 반복해 어느 길이에서도 동그랗게 유지한다.
  DOTTED: {
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'repeat-x',
    backgroundSize: '10px 4px',
  },
  DOUBLE_LINE: {
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 7px',
  },
  HIGHLIGHT: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  },
  UNDERLINE: {
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 6px',
  },
  WAVY: {
    backgroundPosition: 'left bottom',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 6px',
  },
}

function toPaletteColor(color: string): string {
  // 파일은 팔레트 색으로만 만들어 둔다. 서버가 다른 값을 주면 기본색으로 떨어뜨린다.
  const match = DECORATION_COLORS.find((item) => item.toLowerCase() === color.toLowerCase())
  return (match ?? DEFAULT_DECORATION_COLOR).slice(1).toLowerCase()
}

export function decorationBrushStyle({ color, effectType }: DraftDecoration): CSSProperties {
  return {
    backgroundImage: `url(/decorations/${BRUSH_BY_EFFECT[effectType]}-${toPaletteColor(color)}.svg)`,
    ...LAYOUT_BY_EFFECT[effectType],
  }
}
