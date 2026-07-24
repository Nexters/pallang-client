import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTraceViewMode } from '../_hooks/useTraceViewMode'

const scrollTo = (top: number) => ({ currentTarget: { scrollTop: top } })

describe('useTraceViewMode', () => {
  it('초기값은 postit', () => {
    const { result } = renderHook(() => useTraceViewMode())
    expect(result.current.viewMode).toBe('postit')
  })

  it('scrollTop 40 초과 시 compact로 전환한다', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(41))
    })
    expect(result.current.viewMode).toBe('compact')
  })

  it('히스테리시스: 8 이상에서는 compact 유지, 8 미만이면 postit 복귀한다', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(41))
    })
    act(() => {
      result.current.handleListScroll(scrollTo(20))
    })
    expect(result.current.viewMode).toBe('compact')
    act(() => {
      result.current.handleListScroll(scrollTo(7))
    })
    expect(result.current.viewMode).toBe('postit')
  })

  it('postit 상태에서 40 이하는 postit을 유지한다', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(39))
    })
    expect(result.current.viewMode).toBe('postit')
  })
})
