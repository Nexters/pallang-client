/**
 * 노트(대목 카드)의 치수. 노트 아래로 깔리는 어두운 띠와 한 쌍이라 한곳에서 같이 잡는다 —
 * 둘 중 하나만 고치면 밝음/어둠 경계가 노트 어중간한 곳에 걸린다.
 *
 * - `compact` ①·② — 상단에 책 카드가 붙어 그만큼 노트가 낮다(시안 3077:15661 · 3077:15829).
 * - `default` ③ — 책 카드가 본문 안에 있어 종전 치수 그대로다.
 */
export const TRACE_NOTE_SIZE = {
  compact: { note: 'h-[290px]', dark: 'h-[145px]' },
  default: { note: 'h-[320px]', dark: 'h-[199px]' },
} as const

export type TraceNoteSize = keyof typeof TRACE_NOTE_SIZE
