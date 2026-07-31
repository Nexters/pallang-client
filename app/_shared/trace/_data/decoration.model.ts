/** 생성 타입 DecorationRequestEffectType·DecorationResponseEffectType과 값이 같다.
 *  _apis import 금지 규칙 때문에 로컬로 둔다. */
export type EffectType = 'CIRCLE' | 'DOTTED' | 'DOUBLE_LINE' | 'HIGHLIGHT' | 'UNDERLINE' | 'WAVY'

/** 흔적 남기기(작성 중인 초안)와 흔적 보기(서버 응답)가 함께 쓰는 꾸미기 효과 한 개.
 *  서버 DecorationResponse의 decorationId는 렌더에 쓰지 않아 담지 않는다. */
export type Decoration = {
  startOffset: number
  /** exclusive — quotedText.slice(startOffset, endOffset) */
  endOffset: number
  effectType: EffectType
  color: string
}
