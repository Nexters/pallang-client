import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useOverlayBackGuard } from '../_hooks/useOverlayBackGuard'
import { useTraceOverlay } from '../_hooks/useTraceOverlay'

function Sheet({ label, onClose, open }: { label: string; onClose: () => void; open: boolean }) {
  useOverlayBackGuard(open, onClose)
  return open ? <p>{label} 열림</p> : null
}

function Harness() {
  const [first, setFirst] = useState(false)
  const [second, setSecond] = useState(false)
  // hasOverlay/closeTop은 ref를 읽는 이벤트 시점 API다. 렌더에 그대로 쓰면 값이 갱신되지 않으므로
  // 마지막 뒤로가기 결과를 state로 받아 둔다.
  const [lastCloseResult, setLastCloseResult] = useState<boolean | null>(null)
  const overlay = useTraceOverlay()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFirst(true)
        }}
      >
        첫 시트 열기
      </button>
      <button
        type="button"
        onClick={() => {
          setSecond(true)
        }}
      >
        둘째 시트 열기
      </button>
      <button
        type="button"
        onClick={() => {
          setLastCloseResult(overlay.closeTop())
        }}
      >
        뒤로
      </button>
      <p>닫은 층 있음: {String(lastCloseResult)}</p>
      <Sheet
        label="첫"
        open={first}
        onClose={() => {
          setFirst(false)
        }}
      />
      <Sheet
        label="둘째"
        open={second}
        onClose={() => {
          setSecond(false)
        }}
      />
    </>
  )
}

describe('오버레이 스택', () => {
  it('닫을 오버레이가 없으면 closeTop이 false를 돌려준다', () => {
    const spy = vi.fn()

    function Probe() {
      const overlay = useTraceOverlay()
      return (
        <button
          type="button"
          onClick={() => {
            spy(overlay.closeTop())
          }}
        >
          뒤로
        </button>
      )
    }

    render(
      <TraceOverlayProvider>
        <Probe />
      </TraceOverlayProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(spy).toHaveBeenCalledWith(false)
  })

  it('가장 나중에 열린 오버레이부터 닫는다', () => {
    render(
      <TraceOverlayProvider>
        <Harness />
      </TraceOverlayProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '첫 시트 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '둘째 시트 열기' }))

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.queryByText('둘째 열림')).toBeNull()
    expect(screen.getByText('첫 열림')).toBeTruthy()
    expect(screen.getByText('닫은 층 있음: true')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.queryByText('첫 열림')).toBeNull()

    // 다 걷어낸 뒤의 뒤로가기는 닫을 층이 없다고 알려, 호출부가 이탈 판정으로 넘어가게 한다
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.getByText('닫은 층 있음: false')).toBeTruthy()
  })
})
