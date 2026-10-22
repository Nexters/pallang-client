import type { TextBlockBreakType } from '@/app/_global/_queries/passage.queries'

export type OcrBlock = { text: string; breakType: TextBlockBreakType; indented: boolean }

const INDENT = '　'

// 조립 규칙: pallang-server#180
const SEPARATOR: Record<TextBlockBreakType, string> = {
  NONE: ' ',
  WRAP: ' ',
  LINE: '\n',
  PARAGRAPH: '\n',
  BLANK_LINE: '\n\n',
}

function* pieces(blocks: OcrBlock[]): Generator<[index: number, piece: string]> {
  let separator = ''
  for (const [index, block] of blocks.entries()) {
    if (block.text.length === 0) continue
    yield [index, separator + (block.indented ? INDENT : '') + block.text]
    separator = SEPARATOR[block.breakType]
  }
}

// 한글은 어절 중간에서도 줄이 꺾여("그리하 / 여") 그 자리에 공백이 잘못 낀다. 좌표로는 못 가려 시트에서 고치게 둔다.
export function joinBlockTexts(blocks: OcrBlock[]): string {
  return Array.from(pieces(blocks), ([, piece]) => piece).join('')
}

// 상한을 넘기는 블록 앞에서 끊는다 — 어절 중간이 잘리지 않고 사진 위 블록 단위로 경계를 보여줄 수 있다.
export function countWithinLimit(blocks: OcrBlock[], max: number): number {
  let length = 0
  for (const [index, piece] of pieces(blocks)) {
    length += piece.length
    if (length > max) return index
  }
  return blocks.length
}
