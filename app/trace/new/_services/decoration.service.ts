import type { DraftDecoration } from '../_types/traceDraft.type'

export type TextSegment = { text: string; decoration: DraftDecoration | null }

export function splitByDecorations(text: string, decorations: DraftDecoration[]): TextSegment[] {
  const segments: TextSegment[] = []
  const sorted = [...decorations].sort((a, b) => a.startOffset - b.startOffset)
  let cursor = 0

  for (const decoration of sorted) {
    // 겹침은 입력 단계에서 제거되지만 방어적으로 건너뛴다.
    if (decoration.startOffset < cursor) continue
    if (decoration.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, decoration.startOffset), decoration: null })
    }
    segments.push({ text: text.slice(decoration.startOffset, decoration.endOffset), decoration })
    cursor = decoration.endOffset
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), decoration: null })
  }
  return segments
}
