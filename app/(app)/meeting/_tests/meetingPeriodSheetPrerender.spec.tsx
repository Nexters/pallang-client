import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { MeetingPeriodSheet } from '../_components/MeetingPeriodSheet/MeetingPeriodSheet'

/**
 * 인자 없는 `new Date()`(=현재 시각 읽기)를 세는 Date. 프리렌더는 현재 시각을 줄 수 없어
 * cacheComponents가 이 호출을 빌드 에러로 막는다(next-prerender-current-time-client).
 */
function countingClock(onRead: () => void): DateConstructor {
  const RealDate = Date
  return class extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) onRead()
      // @ts-expect-error 실제 Date 생성자 인자를 그대로 넘긴다
      super(...args)
    }
  } as unknown as DateConstructor
}

describe('MeetingPeriodSheet 프리렌더', () => {
  it('서버 렌더에서는 현재 시각을 읽지 않는다 — 읽으면 /meeting/new 프리렌더가 빌드에서 깨진다', () => {
    let clockReads = 0
    const RealDate = globalThis.Date
    globalThis.Date = countingClock(() => {
      clockReads += 1
    })

    try {
      renderToStaticMarkup(
        <HardwareBackProvider>
          <MeetingPeriodSheet
            open={false}
            startDate=""
            endDate=""
            onClose={() => undefined}
            onConfirm={() => undefined}
          />
        </HardwareBackProvider>,
      )
    } finally {
      globalThis.Date = RealDate
    }

    expect(clockReads).toBe(0)
  })
})
