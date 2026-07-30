import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'

// 가짜 타이머 대신 짧은 실제 duration을 쓴다 — requestAnimationFrame과 setTimeout이
// 섞여 있어 가짜 타이머로는 전이 순서를 맞추기 번거롭다.
const DURATION = 20

describe('useExitTransition', () => {
  it('처음부터 열려 있으면 등장 전환 없이 바로 open이다', () => {
    const { result } = renderHook(() => useExitTransition(true, DURATION))

    expect(result.current.shouldRender).toBe(true)
    expect(result.current.state).toBe('open')
  })

  it('처음부터 닫혀 있으면 렌더하지 않는다', () => {
    const { result } = renderHook(() => useExitTransition(false, DURATION))

    expect(result.current.shouldRender).toBe(false)
  })

  it('열리면 entering을 거쳐 open이 된다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: false },
    })

    rerender({ open: true })
    expect(result.current.shouldRender).toBe(true)
    expect(result.current.state).toBe('entering')

    await waitFor(() => {
      expect(result.current.state).toBe('open')
    })
  })

  it('닫혀도 duration 동안은 exiting 상태로 렌더를 유지한다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: true },
    })

    rerender({ open: false })
    expect(result.current.shouldRender).toBe(true)
    expect(result.current.state).toBe('exiting')

    await waitFor(() => {
      expect(result.current.shouldRender).toBe(false)
    })
  })

  it('퇴장 도중 다시 열리면 렌더를 유지한 채 open으로 돌아온다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: true },
    })

    rerender({ open: false })
    rerender({ open: true })

    await waitFor(() => {
      expect(result.current.state).toBe('open')
    })
    expect(result.current.shouldRender).toBe(true)
  })
})
