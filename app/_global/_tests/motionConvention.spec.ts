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

// 클래스 문자열은 tsx뿐 아니라 ts 상수(_styles/*.constant.ts)에도 산다
const CLASS_FILES = collectFiles(APP_DIR, ['.tsx', '.ts'])
const STYLE_FILES = collectFiles(APP_DIR, ['.css'])

// 규칙을 설명하는 주석에는 금지 패턴이 그대로 등장한다 — 코드만 보게 걷어낸다
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function findOffenders(files: readonly string[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(stripComments(readFileSync(file, 'utf8'))))
    .map((file) => file.slice(APP_DIR.length))
}

describe('모션 컨벤션', () => {
  it('스캔 대상 파일을 실제로 찾는다', () => {
    expect(CLASS_FILES.length).toBeGreaterThan(20)
    expect(STYLE_FILES.length).toBeGreaterThan(0)
  })

  it('duration을 임의값으로 쓰지 않는다 — duration-instant/fast/normal/slow만 쓴다', () => {
    // duration-200 · duration-[200ms] · duration-(--var) 세 형태를 모두 막는다.
    // 마지막 것은 `(--`까지 봐야 한다 — 그냥 `(`면 정규식 리터럴 `--duration-([a-z]+)`에 오탐이 난다.
    // 이 spec 자신은 패턴 문자열을 담고 있으므로 검사 대상에서 빠진다(.ts지만 이 파일은 제외).
    const offenders = findOffenders(
      CLASS_FILES.filter((file) => !file.endsWith('motionConvention.spec.ts')),
      /\bduration-(?:\d|\[|\(--)/,
    )
    expect(offenders).toEqual([])
  })

  it('easing을 토큰 밖 값으로 쓰지 않는다 — ease-enter/exit/standard만 쓴다', () => {
    // 빌트인(ease-in/out/linear)과 임의값(ease-[...], ease-(--var))을 함께 막는다.
    const offenders = findOffenders(
      CLASS_FILES.filter((file) => !file.endsWith('motionConvention.spec.ts')),
      /\bease-(?:in\b|in-out\b|out\b|linear\b|\[|\(--)/,
    )
    expect(offenders).toEqual([])
  })

  it('컴포넌트에서 새 keyframes 애니메이션을 만들지 않는다', () => {
    // 움직임 축소 정책이 --duration-* 오버라이드로 동작해 keyframes에는 닿지 않는다.
    // 기존 스켈레톤(animate-pulse)만 예외로 남긴다.
    const offenders = findOffenders(
      CLASS_FILES.filter((file) => !file.endsWith('motionConvention.spec.ts')),
      /\banimate-(?!pulse\b)[a-z]/,
    )
    expect(offenders).toEqual([])
  })

  it('스타일시트에 @keyframes를 새로 만들지 않는다', () => {
    // 같은 이유로 CSS 쪽도 막는다 — tsx만 훑으면 globals.css의 keyframes가 그대로 통과한다.
    expect(findOffenders(STYLE_FILES, /@keyframes\b/)).toEqual([])
  })
})
