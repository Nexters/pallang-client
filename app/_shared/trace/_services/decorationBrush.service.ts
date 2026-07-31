import type { CSSProperties } from 'react'

import type { Decoration, EffectType } from '../_data/decoration.model'
import { DECORATION_COLORS, DEFAULT_DECORATION_COLOR } from '../_data/decorationColor.constant'

/**
 * 효과 자국은 시안 아이콘에서 뽑은 붓 벡터를 글자 뒤에 배경으로 깐다.
 * mask로 칠하면 글자까지 같이 잘려서, 팔레트 색마다 미리 만든 파일을 쓴다.
 */
const BRUSH_BY_EFFECT: Record<Exclude<EffectType, 'HIGHLIGHT'>, string> = {
  CIRCLE: 'circle',
  DOTTED: 'dots',
  DOUBLE_LINE: 'underline',
  UNDERLINE: 'pencil',
  WAVY: 'wave',
}

/** 글자를 감싸는 효과는 칸 전체로 늘이고, 밑줄 계열은 아랫단에 정해진 높이로 깐다. */
const LAYOUT_BY_EFFECT: Record<
  Exclude<EffectType, 'HIGHLIGHT'>,
  Pick<
    CSSProperties,
    | 'backgroundPosition'
    | 'backgroundRepeat'
    | 'backgroundSize'
    | 'marginInline'
    | 'paddingBlock'
    | 'paddingInline'
  >
> = {
  CIRCLE: {
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
    // 자국은 아이콘용 원(30×27)이 아니라 글줄을 감싸도록 그려진 가로로 긴 손그림(2209:16733)이다.
    // viewBox가 110×30인데 루프는 그 안쪽 4~106 / 2~28에만 있어, 칸에 그대로 늘이면
    // 루프가 글자보다 안쪽으로 들어와 글자 끝을 가른다. 그만큼 칸을 넓혀 준다.
    // 세로 패딩은 줄 배치를 바꾸지 않고 배경 영역만 넓히고(CSS 2.1 §10.8.1),
    // 가로는 같은 크기의 음수 마진으로 글자 진행 폭을 0으로 상쇄해 글자 위치를 지킨다.
    marginInline: '-0.7em',
    paddingBlock: '0.3em',
    paddingInline: '0.7em',
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

export function decorationBrushStyle({ color, effectType }: Decoration): CSSProperties {
  // 형광펜은 붓 자국이 아니라 형광펜으로 그은 띠다. 글자가 읽히도록 반투명하게 깐다.
  if (effectType === 'HIGHLIGHT') {
    return { backgroundColor: `color-mix(in srgb, ${color} 40%, transparent)` }
  }
  return {
    backgroundImage: `url(/decorations/${BRUSH_BY_EFFECT[effectType]}-${toPaletteColor(color)}.svg)`,
    ...LAYOUT_BY_EFFECT[effectType],
  }
}
