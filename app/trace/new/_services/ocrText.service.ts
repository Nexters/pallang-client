export type OcrBlock = { text: string; lineBreak: boolean }

export function joinBlockTexts(blocks: OcrBlock[]): string {
  return blocks.reduce((acc, block, index) => {
    if (index === blocks.length - 1) return acc + block.text
    return acc + block.text + (block.lineBreak ? '\n' : ' ')
  }, '')
}

export function clampQuote(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max)
}
