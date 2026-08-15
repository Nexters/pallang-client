export type OcrBlock = { text: string }

/**
 * 고른 블록들을 한 문단으로 잇는다.
 *
 * 블록은 어절 단위이고 API가 함께 주는 `lineBreak`는 "이 어절이 인쇄된 줄의 마지막"이라는 뜻이다.
 * 문단이 끝났다는 뜻이 아니라 책 판형 때문에 생긴 줄바꿈이라, 그대로 옮기면 발췌문에 책의 줄나눔이
 * 복제된다. 그래서 읽지 않고 전부 공백으로 잇는다.
 *
 * 대가: 한글은 어절 중간에서도 줄이 끊기므로("그리하 / 여") 그런 자리에는 공백이 잘못 낀다.
 * 인식 결과는 시트에서 바로 고칠 수 있으니 여기서 추측하지 않는다.
 */
export function joinBlockTexts(blocks: OcrBlock[]): string {
  return blocks
    .map((block) => block.text)
    .filter((text) => text.length > 0)
    .join(' ')
}

/**
 * 앞에서부터 몇 블록까지 상한 안에 담기는지 센다.
 *
 * 넘긴 글자를 잘라내는 대신 넘기는 블록 앞에서 끊는다 — 어절 중간이 잘린 발췌문이 남지 않고,
 * "여기까지 담겼다"를 사진 위 블록 단위로 그대로 보여줄 수 있다.
 * 길이 계산은 joinBlockTexts와 같은 규칙이어야 한다(빈 블록은 빼고 공백 하나로 잇기).
 */
export function countWithinLimit(blocks: OcrBlock[], max: number): number {
  let length = 0
  for (const [index, block] of blocks.entries()) {
    if (block.text.length === 0) continue
    const next = length === 0 ? block.text.length : length + 1 + block.text.length
    if (next > max) return index
    length = next
  }
  return blocks.length
}
