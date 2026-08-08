import { fireEvent, render, screen } from '@testing-library/react'
import { act, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

import { DecorationEditPopover } from '../_components/DecorationEditPopover/DecorationEditPopover'
import type { DraftDecoration } from '../_types/traceDraft.type'

type Editing = { decoration: DraftDecoration; left: number; top: number }

const initialEditing: Editing = {
  decoration: { startOffset: 0, endOffset: 3, effectType: 'HIGHLIGHT', color: '#ED6243' },
  left: 120,
  top: 40,
}

/**
 * TraceDecorateForm의 배선(useExitTransition + useLastPresent + DecorationEditPopover)을 그대로
 * 재현한 테스트 전용 래퍼. onRemove는 실제 호출부처럼 상태 초기화(setEditing(null))까지 겸한다.
 */
function PopoverHarness() {
  const [editing, setEditing] = useState<Editing | null>(initialEditing)
  const shownEditing = useLastPresent(editing)
  const popover = useExitTransition(editing !== null, MOTION_DURATION.fast)

  return (
    <>
      {popover.shouldRender && shownEditing && (
        <DecorationEditPopover
          color={shownEditing.decoration.color}
          left={shownEditing.left}
          top={shownEditing.top}
          state={popover.state}
          onClose={() => {
            setEditing(null)
          }}
          onRecolor={() => undefined}
          onRemove={() => {
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

describe('DecorationEditPopover 전환', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('마운트 시점부터 열려 있으면 등장 전환 없이 open 상태다', () => {
    render(<PopoverHarness />)

    expect(screen.getByRole('dialog', { name: '효과 편집' })).toHaveAttribute('data-state', 'open')
  })

  it('닫혀도 duration 동안 색·좌표를 유지한 채 남아 있다가 사라진다', () => {
    render(<PopoverHarness />)

    fireEvent.click(screen.getByRole('button', { name: '효과 지우기' }))

    // 퇴장 전환 중에도 좌표·색이 남아 있어야 팝오버가 제자리에서 줄어들며 사라진다
    const popover = screen.getByRole('dialog', { name: '효과 편집' })
    expect(popover).toHaveAttribute('data-state', 'exiting')
    expect(popover.style.left).toBe('120px')
    expect(popover.style.top).toBe('40px')
    expect(screen.getByRole('button', { name: '색 #ED6243' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    act(() => {
      vi.advanceTimersByTime(MOTION_DURATION.fast - 1)
    })
    expect(screen.getByRole('dialog', { name: '효과 편집' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('dialog', { name: '효과 편집' })).not.toBeInTheDocument()
  })
})
