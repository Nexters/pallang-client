import type { CSSProperties } from 'react'

import { DECORATION_COLORS, DEFAULT_DECORATION_COLOR } from '../_data/decorationColor.constant'
import type { DraftDecoration, DraftEffectType } from '../_types/traceDraft.type'

/**
 * 효과 자국은 시안 아이콘에서 뽑은 붓 벡터를 글자 뒤에 배경으로 깐다.
 * mask로 칠하면 글자까지 같이 잘려서, 팔레트 색마다 미리 만든 파일을 쓴다.
 */
const BRUSH_BY_EFFECT: Record<Exclude<DraftEffectType, 'HIGHLIGHT'>, string> = {
  CIRCLE: 'circle',
  DOTTED: 'dots',
  DOUBLE_LINE: 'underline',
  UNDERLINE: 'pencil',
  WAVY: 'wave',
}

/** 글자를 감싸는 효과는 칸 전체로 늘이고, 밑줄 계열은 아랫단에 정해진 높이로 깐다. */
const LAYOUT_BY_EFFECT: Record<
  Exclude<DraftEffectType, 'HIGHLIGHT'>,
  Pick<CSSProperties, 'backgroundPosition' | 'backgroundRepeat' | 'backgroundSize' | 'paddingBlock'>
> = {
  CIRCLE: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
    // 배경은 요소 박스 안에만 그려지는데 글자의 인라인 박스가 낮아 타원의 위아래 호가 잘린다.
    // 인라인 요소의 세로 패딩은 줄 배치를 바꾸지 않고 배경 영역만 넓힌다(CSS 2.1 §10.8.1).
    // 가로 패딩은 글자를 밀어 드래그로 짚은 위치를 어긋나게 하므로 쓰지 않는다.
    paddingBlock: '0.45em',
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
  // 형광펜은 붓 자국이 아니라 형광펜으로 그은 띠다. 글자가 읽히도록 반투명하게 깐다.
  if (effectType === 'HIGHLIGHT') {
    return { backgroundColor: `color-mix(in srgb, ${color} 40%, transparent)` }
  }
  return {
    backgroundImage: `url(/decorations/${BRUSH_BY_EFFECT[effectType]}-${toPaletteColor(color)}.svg)`,
    ...LAYOUT_BY_EFFECT[effectType],
  }
}
