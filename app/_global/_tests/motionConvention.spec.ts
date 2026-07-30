// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const APP_DIR = fileURLToPath(new URL('../..', import.meta.url))

// 생성물은 우리 컨벤션 대상이 아니다
const IGNORED_DIRS = new Set(['_generated'])

function collectTsxFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      files.push(...collectTsxFiles(join(dir, entry.name)))
      continue
    }
    if (entry.name.endsWith('.tsx')) files.push(join(dir, entry.name))
  }
  return files
}

const APP_TSX_FILES = collectTsxFiles(APP_DIR)

function findOffenders(pattern: RegExp): string[] {
  return APP_TSX_FILES.filter((file) => pattern.test(readFileSync(file, 'utf8'))).map((file) =>
    file.slice(APP_DIR.length),
  )
}

describe('모션 컨벤션', () => {
  it('스캔 대상 파일을 실제로 찾는다', () => {
    expect(APP_TSX_FILES.length).toBeGreaterThan(20)
  })

  it('duration을 숫자로 하드코딩하지 않는다 — duration-instant/fast/normal/slow만 쓴다', () => {
    expect(findOffenders(/\bduration-\d/)).toEqual([])
  })

  it('easing을 임의값으로 쓰지 않는다 — ease-enter/exit/standard만 쓴다', () => {
    expect(findOffenders(/\bease-\[/)).toEqual([])
  })

  it('컴포넌트에서 새 keyframes 애니메이션을 만들지 않는다', () => {
    // 움직임 축소 정책이 --duration-* 오버라이드로 동작해 keyframes에는 닿지 않는다.
    // 기존 스켈레톤(animate-pulse)만 예외로 남긴다.
    const offenders = findOffenders(/\banimate-(?!pulse\b)[a-z]/)
    expect(offenders).toEqual([])
  })
})
