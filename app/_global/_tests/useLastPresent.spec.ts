import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

describe('useLastPresent', () => {
  it('값이 있으면 그대로 돌려준다', () => {
    const { result } = renderHook(() => useLastPresent('안녕'))

    expect(result.current).toBe('안녕')
  })

  it('값이 null이 되면 직전 값을 유지한다', () => {
    const { result, rerender } = renderHook<string | null, { value: string | null }>(
      ({ value }) => useLastPresent(value),
      {
        initialProps: { value: '저장했어요' },
      },
    )

    rerender({ value: null })

    expect(result.current).toBe('저장했어요')
  })

  it('새 값이 오면 새 값으로 갱신된다', () => {
    const { result, rerender } = renderHook<string | null, { value: string | null }>(
      ({ value }) => useLastPresent(value),
      {
        initialProps: { value: '첫 번째' },
      },
    )

    rerender({ value: null })
    rerender({ value: '두 번째' })

    expect(result.current).toBe('두 번째')
  })

  it('처음부터 null이면 null을 돌려준다', () => {
    const { result } = renderHook(() => useLastPresent<string>(null))

    expect(result.current).toBeNull()
  })

  it('객체도 참조 그대로 유지한다', () => {
    const trace = { opinionId: 1 }
    const { result, rerender } = renderHook<
      { opinionId: number } | null,
      { value: { opinionId: number } | null }
    >(({ value }) => useLastPresent(value), {
      initialProps: { value: trace },
    })

    rerender({ value: null })

    expect(result.current).toBe(trace)
  })
})
