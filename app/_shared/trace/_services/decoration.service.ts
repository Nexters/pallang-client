import type { Decoration } from '../_data/decoration.model'

/** startOffset은 quotedText 안에서 이 조각이 시작하는 위치다(slice 기준). */
export type TextSegment = { decoration: Decoration | null; startOffset: number; text: string }

export function splitByDecorations(text: string, decorations: Decoration[]): TextSegment[] {
  const segments: TextSegment[] = []
  const sorted = [...decorations].sort((a, b) => a.startOffset - b.startOffset)
  let cursor = 0

  for (const decoration of sorted) {
    // 겹침은 입력 단계에서 제거되지만 방어적으로 건너뛴다.
    if (decoration.startOffset < cursor) continue
    // 조회 화면은 서버가 준 오프셋을 그대로 받는다. 뒤집힌 범위를 그냥 두면 cursor가 되감겨
    // 남은 글자가 두 번 그려지므로 버린다.
    if (decoration.endOffset <= decoration.startOffset) continue
    if (decoration.startOffset > cursor) {
      segments.push({
        decoration: null,
        startOffset: cursor,
        text: text.slice(cursor, decoration.startOffset),
      })
    }
    segments.push({
      decoration,
      startOffset: decoration.startOffset,
      text: text.slice(decoration.startOffset, decoration.endOffset),
    })
    cursor = decoration.endOffset
  }

  if (cursor < text.length) {
    segments.push({ decoration: null, startOffset: cursor, text: text.slice(cursor) })
  }
  return segments
}
