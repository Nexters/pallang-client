// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const bottomSheetSource = readFileSync(
  fileURLToPath(new URL('../_components/BottomSheet/BottomSheet.tsx', import.meta.url)),
  'utf8',
)
const peekSheetSource = readFileSync(
  fileURLToPath(new URL('../_components/PeekSheet/PeekSheet.tsx', import.meta.url)),
  'utf8',
)

describe('시트 패널 표면', () => {
  it('BottomSheet와 PeekSheet는 패널 클래스를 sheetPanelClassName에서 가져온다', () => {
    expect(bottomSheetSource).toContain('sheetPanelClassName')
    expect(peekSheetSource).toContain('sheetPanelClassName')
  })
})
