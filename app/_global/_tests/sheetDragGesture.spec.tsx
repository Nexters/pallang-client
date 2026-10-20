import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSheetDrag } from '@/app/_global/_hooks/useSheetDrag'

/**
 * 시트 제스처가 안쪽 버튼 탭과 끄던 시트의 복구를 망치지 않는지 실제 터치 시퀀스로 잠근다.
 *
 * use-gesture는 모듈이 로드될 때 터치 지원 여부를 정한다. 테스트 환경(happy-dom)은 터치가
 * 없어 마우스 모드로 떨어지므로, import보다 먼저 터치를 켜 실제 기기와 같은 경로를 탄다.
 * useDrag를 모킹하지 않는 이유: 깨졌던 지점이 use-gesture가 핸들러를 부르는 방식
 * (탭은 손 뗄 때 직전 제스처의 first/last를 단 채 온다)과 클릭 가드(filterTaps)의 조합이라,
 * 모킹하면 그 조합이 사라진다.
 */
vi.hoisted(() => {
  window.ontouchstart = null
})

type TouchType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel'

/** 브라우저가 손가락 하나로 만드는 터치 이벤트. 손을 떼거나 빼앗기면 changedTouches에만 남는다 */
function touch(type: TouchType, target: Element, clientY: number) {
  const point = { identifier: 1, target, clientX: 100, clientY }
  const active = type === 'touchend' || type === 'touchcancel' ? [] : [point]
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperties(event, {
    touches: { value: active },
    targetTouches: { value: active },
    changedTouches: { value: [point] },
  })
  target.dispatchEvent(event)
  return event
}

/**
 * 손가락이 지나간 y좌표를 차례로 밟는 탭/드래그. 브라우저처럼 손 뗌의 기본 동작이
 * 막히지 않았을 때만 클릭을 이어 보낸다 — touchend를 preventDefault하면 클릭은 생기지 않는다.
 */
function gesture(target: Element, start: number, ...moves: number[]) {
  touch('touchstart', target, start)
  for (const y of moves) touch('touchmove', target, y)
  const end = touch('touchend', target, moves.at(-1) ?? start)
  if (!end.defaultPrevented) fireEvent.click(target, { detail: 1 })
}

function Sheet({
  canExpand,
  onTap = vi.fn(),
  onMove = vi.fn(),
  onEnd = vi.fn(),
}: {
  canExpand: boolean
  onTap?: () => void
  onMove?: (dy: number) => void
  onEnd?: (end: { dy: number; velocity: number }) => void
}) {
  const bind = useSheetDrag({
    canExpand,
    onMove: (dy) => {
      onMove(dy)
    },
    onEnd: (end) => {
      onEnd(end)
    },
  })
  return (
    <div {...bind()}>
      <button type="button" onClick={onTap}>
        좋아요
      </button>
    </div>
  )
}

describe('시트 안 버튼 탭', () => {
  it('들어오자마자 움직임 없이 탭해도 클릭이 간다', () => {
    const onTap = vi.fn()
    const onMove = vi.fn()
    render(<Sheet canExpand onTap={onTap} onMove={onMove} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300)

    expect(onTap).toHaveBeenCalledOnce()
    // 탭은 시트를 움직인 게 아니다 — 끄는 상태로 들어가면 안 된다
    expect(onMove).not.toHaveBeenCalled()
  })

  it('탭을 여러 번 해도 매번 클릭이 간다', () => {
    const onTap = vi.fn()
    render(<Sheet canExpand onTap={onTap} />)
    const button = screen.getByRole('button', { name: '좋아요' })

    gesture(button, 300)
    gesture(button, 300)
    gesture(button, 300)

    expect(onTap).toHaveBeenCalledTimes(3)
  })

  it('시트가 가져가지 않는 방향으로 손이 떨려도 탭이면 클릭이 간다', () => {
    const onTap = vi.fn()
    // 확장된 시트는 더 올라갈 데가 없어 위 드래그를 스크롤에 넘긴다
    render(<Sheet canExpand={false} onTap={onTap} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300, 298)

    expect(onTap).toHaveBeenCalledOnce()
  })

  it('시트를 끌고 놓은 손은 버튼 클릭이 되지 않는다', () => {
    const onTap = vi.fn()
    const onEnd = vi.fn()
    render(<Sheet canExpand onTap={onTap} onEnd={onEnd} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300, 280, 260)

    expect(onEnd).toHaveBeenCalledOnce()
    expect(onTap).not.toHaveBeenCalled()
  })

  it('스크롤에 넘긴 드래그도 버튼 클릭이 되지 않는다', () => {
    const onTap = vi.fn()
    const onMove = vi.fn()
    render(<Sheet canExpand={false} onTap={onTap} onMove={onMove} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300, 280, 240)

    expect(onMove).not.toHaveBeenCalled()
    expect(onTap).not.toHaveBeenCalled()
  })
})

// onMove가 남긴 인라인(transition 등)이 복구되지 않으면 이후 닫힘 전환이 죽어
// 투명 백드롭이 화면 전체 입력을 삼킨 채 남는다(#406)
describe('끌던 시트의 복구', () => {
  it('시트가 가져간 손 떨림은 탭으로 끝나도 제자리로 돌려놓고 클릭도 보낸다', () => {
    const onTap = vi.fn()
    const onEnd = vi.fn()
    render(<Sheet canExpand onTap={onTap} onEnd={onEnd} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300, 298)

    expect(onEnd).toHaveBeenLastCalledWith({ dy: 0, velocity: 0 })
    expect(onTap).toHaveBeenCalledOnce()
  })

  it('끄던 중 브라우저가 터치를 빼앗아도(touchcancel) onEnd가 불린다', () => {
    const onEnd = vi.fn()
    render(<Sheet canExpand onEnd={onEnd} />)
    const button = screen.getByRole('button', { name: '좋아요' })

    touch('touchstart', button, 300)
    touch('touchmove', button, 280)
    touch('touchcancel', button, 280)

    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('움직인 적 없는 제스처는 onEnd를 부르지 않는다', () => {
    const onEnd = vi.fn()
    render(<Sheet canExpand={false} onEnd={onEnd} />)

    gesture(screen.getByRole('button', { name: '좋아요' }), 300, 280, 240)

    expect(onEnd).not.toHaveBeenCalled()
  })
})
