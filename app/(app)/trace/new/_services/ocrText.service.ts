import type { TextBlockBreakType } from '@/app/_global/_queries/passage.queries'

export type OcrBlock = { text: string; breakType: TextBlockBreakType; indented: boolean }

const INDENT = '　'

/** 이 블록 뒤에 붙는 구분자. 서버(pallang-server#180)가 정한 조립 규칙이다. */
const SEPARATOR: Record<TextBlockBreakType, string> = {
  NONE: ' ',
  WRAP: ' ',
  LINE: '\n',
  PARAGRAPH: '\n',
  BLANK_LINE: '\n\n',
}

/**
 * 블록 하나를 발췌문 조각으로 — 앞 블록 뒤 구분자 + 들여쓰기 + 본문.
 * joinBlockTexts와 countWithinLimit가 같은 계산을 쓰도록 여기 한 곳에만 둔다.
 */
function* pieces(blocks: OcrBlock[]): Generator<[index: number, piece: string]> {
  let separator = ''
  for (const [index, block] of blocks.entries()) {
    if (block.text.length === 0) continue
    yield [index, separator + (block.indented ? INDENT : '') + block.text]
    separator = SEPARATOR[block.breakType]
  }
}

/**
 * 고른 블록들을 잇는다.
 *
 * 블록은 어절 단위다. 서버가 바운딩 박스로 판별한 `breakType`을 따라, 지면 폭 때문에 꺾인 줄(WRAP)은
 * 공백으로 잇고 시의 행·산문 문단(LINE·PARAGRAPH)은 줄바꿈, 실제 빈 줄(BLANK_LINE)은 빈 줄로 옮긴다.
 * `indented`인 어절 앞에는 전각 공백을 붙인다.
 *
 * 대가: 한글은 어절 중간에서도 줄이 꺾이므로("그리하 / 여") 그런 자리에는 공백이 잘못 낀다.
 * 좌표만으로는 가릴 수 없어 인식 결과는 시트에서 바로 고치게 둔다.
 */
export function joinBlockTexts(blocks: OcrBlock[]): string {
  return Array.from(pieces(blocks), ([, piece]) => piece).join('')
}

/**
 * 앞에서부터 몇 블록까지 상한 안에 담기는지 센다.
 *
 * 넘긴 글자를 잘라내는 대신 넘기는 블록 앞에서 끊는다 — 어절 중간이 잘린 발췌문이 남지 않고,
 * "여기까지 담겼다"를 사진 위 블록 단위로 그대로 보여줄 수 있다.
 */
export function countWithinLimit(blocks: OcrBlock[], max: number): number {
  let length = 0
  for (const [index, piece] of pieces(blocks)) {
    length += piece.length
    if (length > max) return index
  }
  return blocks.length
}
