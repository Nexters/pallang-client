// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

const globalsCss = readFileSync(
  fileURLToPath(new URL('../../globals.css', import.meta.url)),
  'utf8',
)

// 움직임 축소 블록은 값이 일부러 다르므로(1ms) 본문 파싱에서 떼어낸다.
// prettier가 CSS를 2칸 들여쓰기로 포맷하므로 바깥 닫는 중괄호만 열 0에 온다.
const REDUCED_MOTION_BLOCK = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/

function parseDurations(css: string): Record<string, number> {
  const durations: Record<string, number> = {}
  for (const [, name, value] of css.matchAll(/--duration-([a-z]+):\s*(\d+)ms/g)) {
    if (!name || !value) continue
    durations[name] = Number(value)
  }
  return durations
}

// 반복(loop)은 이름을 따로 쓴다 — 위 --duration-* 와 움직임 축소에서 갈 곳이 다르기 때문이다.
// `--duration-` 은 하이픈 두 개로 시작해야 매치되므로 위 파서가 이 토큰을 주워가지 않는다.
function parseLoopDurations(css: string): Record<string, number> {
  const durations: Record<string, number> = {}
  for (const [, name, value] of css.matchAll(/--loop-duration-([a-z]+):\s*(\d+)ms/g)) {
    if (!name || !value) continue
    durations[name] = Number(value)
  }
  return durations
}

describe('모션 토큰', () => {
  it('globals.css의 --duration-* 가 MOTION_DURATION과 같다', () => {
    const declared = parseDurations(globalsCss.replace(REDUCED_MOTION_BLOCK, ''))

    expect(declared).toEqual({
      instant: MOTION_DURATION.instant,
      fast: MOTION_DURATION.fast,
      normal: MOTION_DURATION.normal,
      slow: MOTION_DURATION.slow,
    })
  })

  it('모든 duration 토큰에 대응하는 @utility가 있다', () => {
    for (const name of Object.keys(MOTION_DURATION)) {
      expect(globalsCss).toContain(`@utility duration-${name}`)
    }
  })

  it('움직임 축소 설정에서는 전환 duration이 1ms로 떨어진다', () => {
    const reducedBlock = REDUCED_MOTION_BLOCK.exec(globalsCss)?.[0] ?? ''

    expect(parseDurations(reducedBlock)).toEqual({
      instant: 1,
      fast: 1,
      normal: 1,
      slow: 1,
    })
  })

  it('움직임 축소 설정에서 반복 duration은 1ms로 떨어지지 않고 느려진다', () => {
    // 유한한 전환에 1ms는 "즉시 끝"이지만 무한 반복에 1ms는 초당 1000바퀴 스트로브다.
    // 반복을 쓰는 곳(스피너·스켈레톤)은 상태 정보라 끄지도 못한다 — 그래서 속도만 떨어뜨린다.
    const base = parseLoopDurations(globalsCss.replace(REDUCED_MOTION_BLOCK, ''))
    const reduced = parseLoopDurations(REDUCED_MOTION_BLOCK.exec(globalsCss)?.[0] ?? '')

    expect(Object.keys(base).length).toBeGreaterThan(0)
    expect(Object.keys(reduced)).toEqual(Object.keys(base))
    for (const [name, value] of Object.entries(base)) {
      expect(reduced[name], `--loop-duration-${name}`).toBeGreaterThan(value)
    }
  })

  it('등장·퇴장·상태 전환 easing 토큰이 선언되어 있다', () => {
    expect(globalsCss).toContain('--ease-enter:')
    expect(globalsCss).toContain('--ease-exit:')
    expect(globalsCss).toContain('--ease-standard:')
  })
})
