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

  it('움직임 축소 설정에서는 모든 duration이 1ms로 떨어진다', () => {
    const reducedBlock = REDUCED_MOTION_BLOCK.exec(globalsCss)?.[0] ?? ''

    expect(parseDurations(reducedBlock)).toEqual({
      instant: 1,
      fast: 1,
      normal: 1,
      slow: 1,
    })
  })

  it('등장·퇴장·상태 전환 easing 토큰이 선언되어 있다', () => {
    expect(globalsCss).toContain('--ease-enter:')
    expect(globalsCss).toContain('--ease-exit:')
    expect(globalsCss).toContain('--ease-standard:')
  })
})
