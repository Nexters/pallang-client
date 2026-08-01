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

  it('반복 애니메이션은 빌트인 spin·pulse 두 개로만 만든다', () => {
    // 무한 반복은 transition으로 표현할 수 없어 keyframes가 유일한 수단이다. 그래서 금지하는 대신
    // 빌트인 둘로 묶고, 그 duration을 globals.css에서 --loop-duration-* 로 빼 움직임 축소가 닿게 했다
    // (아래 검사가 그 연결을 잠근다). 셋째를 만들면 그 연결이 없는 애니메이션이 생긴다.
    const offenders = findOffenders(
      CLASS_FILES.filter((file) => !file.endsWith('motionConvention.spec.ts')),
      // 뒤에 [( 도 본다 — animate-[...] · animate-(--var) 같은 임의값도 같이 막는다.
      // 부정 전방탐색은 (?![\w-])까지 봐야 animate-spin-slow 같은 파생 유틸이 새지 않는다.
      /\banimate-(?!(?:pulse|spin)(?![\w-]))[a-z[(]/,
    )
    expect(offenders).toEqual([])
  })

  it('빌트인 반복 유틸의 duration이 loop 토큰을 거친다', () => {
    // 위 허용 목록이 "이름을 봐주는 것"으로 굳지 않게 근거를 여기서 강제한다.
    // 빌트인 기본값(spin 1s / pulse 2s)은 duration이 선언에 박혀 있어 움직임 축소를 빠져나간다.
    const globalsCss = readFileSync(join(APP_DIR, 'globals.css'), 'utf8')

    for (const name of ['spin', 'pulse']) {
      const declaration = new RegExp(`--animate-${name}:[^;]*;`).exec(globalsCss)?.[0]
      expect(declaration, `--animate-${name}을 globals.css에서 재정의해야 한다`).toBeDefined()
      expect(declaration).toContain(`var(--loop-duration-${name})`)
    }
  })

  it('스타일시트에 @keyframes를 새로 만들지 않는다', () => {
    // 같은 이유로 CSS 쪽도 막는다 — tsx만 훑으면 globals.css의 keyframes가 그대로 통과한다.
    expect(findOffenders(STYLE_FILES, /@keyframes\b/)).toEqual([])
  })
})
