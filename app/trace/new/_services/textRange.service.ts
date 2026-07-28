export type TextRange = { startOffset: number; endOffset: number }

/** anchor와 focus는 모두 글자 인덱스(inclusive)다. 결과의 endOffset은 exclusive다. */
export function normalizeRange(anchor: number, focus: number): TextRange {
  const start = Math.min(anchor, focus)
  const end = Math.max(anchor, focus)
  return { startOffset: start, endOffset: end + 1 }
}
