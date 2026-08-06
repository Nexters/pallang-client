// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const APP_DIR = fileURLToPath(new URL('../..', import.meta.url))

// 생성물은 우리 컨벤션 대상이 아니다
const IGNORED_DIRS = new Set(['_generated'])

function collectFiles(dir: string, extensions: readonly string[]): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      files.push(...collectFiles(join(dir, entry.name), extensions))
      continue
    }
    if (extensions.some((extension) => entry.name.endsWith(extension))) {
      files.push(join(dir, entry.name))
    }
  }
  return files
}

const SOURCE_FILES = collectFiles(APP_DIR, ['.tsx', '.ts']).filter(
  (file) => !file.endsWith('safeAreaConvention.spec.ts'),
)
const STYLE_FILES = collectFiles(APP_DIR, ['.css'])

/** 규칙을 설명하는 주석에는 금지 패턴이 그대로 등장한다 — 코드만 보게 걷어낸다 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function findOffenders(files: readonly string[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(stripComments(readFileSync(file, 'utf8'))))
    .map((file) => file.slice(APP_DIR.length))
}

describe('safe area 컨벤션', () => {
  it('스캔 대상 파일을 실제로 찾는다', () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(20)
    expect(STYLE_FILES.length).toBeGreaterThan(0)
  })

  it('상하 인셋은 env()를 직접 읽지 않는다 — 토큰을 거친다', () => {
    // Android는 시스템 바 인셋을 env()로 주지 않는 웹뷰가 있어 MainActivity가 토큰에 실제 값을
    // 덮어쓴다. env()를 직접 읽으면 그 보정을 못 받는다. 정의부(globals.css)만 예외다.
    // 좌우(left/right)는 토큰이 없다 — 가로 모드가 없어 CameraCheck 한 곳만 직접 읽는다.
    expect(findOffenders(SOURCE_FILES, /env\(\s*safe-area-inset-(?:top|bottom)/)).toEqual([])
  })

  it('하단 인셋을 인라인 style로 흩뿌리지 않는다 — pb-safe 유틸리티를 쓴다', () => {
    // 같은 식을 여러 곳이 손으로 반복하면 빠뜨려도 티가 안 난다.
    // 약관 동의 화면이 그렇게 새서 "다음" 버튼이 홈 인디케이터에 덮였다.
    expect(
      findOffenders(SOURCE_FILES, /max\(\s*[\d.]+rem\s*,\s*var\(--safe-bottom\)\s*\)/),
    ).toEqual([])
  })

  it('pb-safe 유틸리티가 --safe-bottom 토큰을 거친다', () => {
    // 위 검사가 "이름만 봐주는 것"으로 굳지 않게 근거를 여기서 강제한다.
    const globalsCss = readFileSync(join(APP_DIR, 'globals.css'), 'utf8')
    const utility = /@utility pb-safe \{[^}]*\}/.exec(globalsCss)?.[0]

    expect(utility, 'globals.css에 @utility pb-safe를 정의해야 한다').toBeDefined()
    expect(utility).toContain('var(--safe-bottom)')
  })
})
