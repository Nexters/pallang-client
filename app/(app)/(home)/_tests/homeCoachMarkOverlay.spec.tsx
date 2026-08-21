import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'

import { HomeCoachMarkOverlay } from '../_components/HomeCoachMarkOverlay/HomeCoachMarkOverlay'

const OVERLAY_WIDTH = 375
const BUBBLE_WIDTH = 250
const BUBBLE_HEIGHT = 92
const CUTOUT_PADDING = 8
// 시안(375px)에서 실측한 대상 좌표
const TRACE_BUTTON_RECT = { height: 52, left: 148, top: 744, width: 80 }
const BOOK_TAB_RECT = { height: 46, left: 84, top: 747, width: 48 }

type StubRect = { height: number; left: number; top: number; width: number }

function toDomRect({ height, left, top, width }: StubRect): DOMRect {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    toJSON: () => ({}),
    top,
    width,
    x: left,
    y: top,
  }
}

// happy-dom은 레이아웃을 계산하지 않아 모든 rect가 0이다. 코치마크는 rect를 재서 자리를 잡으므로
// 실제 화면 대신 이 스텁이 "375px 화면에서 대상이 여기 있다"를 대신 알려준다.
function stubLayout(targetRects: Record<string, StubRect>) {
  const spy = vi
    .spyOn(Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function stubbed(this: Element): DOMRect {
      if (this.getAttribute('role') === 'dialog') {
        return toDomRect({ height: 812, left: 0, top: 0, width: OVERLAY_WIDTH })
      }
      if (this.classList.contains('w-[250px]')) {
        return toDomRect({ height: BUBBLE_HEIGHT, left: 0, top: 0, width: BUBBLE_WIDTH })
      }

      const targetName = this.getAttribute('data-home-coachmark-target')
      const targetRect = targetName === null ? undefined : targetRects[targetName]

      // happy-dom이 원래 돌려주는 값도 전부 0이라, 지정하지 않은 엘리먼트는 0으로 둔다
      return toDomRect(targetRect ?? { height: 0, left: 0, top: 0, width: 0 })
    })

  return () => {
    spy.mockRestore()
  }
}

function renderOverlay(targetNames: string[]) {
  return render(
    <AppBackProvider>
      {targetNames.map((targetName) => (
        <div key={targetName} data-home-coachmark-target={targetName} />
      ))}
      <HomeCoachMarkOverlay onFinish={vi.fn()} />
    </AppBackProvider>,
  )
}

function getOverlayParts() {
  const dialog = screen.getByRole('dialog')
  const children = [...dialog.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )

  return {
    bubble: children.find((child) => child.classList.contains('w-[250px]')),
    cutout: children.find((child) => child.style.width !== ''),
    dialog,
  }
}

const ALL_TARGET_NAMES = ['trace-button', 'library-book-cover', 'library-book-info', 'book-tab']

async function goToLastStep() {
  await userEvent.click(screen.getByRole('button', { name: '다음' }))
  await userEvent.click(screen.getByRole('button', { name: '다음' }))
}

let restoreLayout: (() => void) | undefined

describe('홈 코치마크 오버레이', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    restoreLayout?.()
    restoreLayout = undefined
  })

  // 예전에는 1단계 구멍과 강조가 bottom-4로 박혀 있어, 탭바가 pb-(--safe-bottom)만큼
  // 늘어나는 기기에서 진짜 + 버튼을 벗어났다.
  it('구멍은 하드코딩 좌표가 아니라 실제 + 버튼 rect에 사방 8px 여유를 더해 나온다', () => {
    restoreLayout = stubLayout({ 'trace-button': TRACE_BUTTON_RECT })

    renderOverlay(['trace-button'])

    const { cutout } = getOverlayParts()
    expect(cutout?.style.left).toBe(`${String(TRACE_BUTTON_RECT.left - CUTOUT_PADDING)}px`)
    expect(cutout?.style.top).toBe(`${String(TRACE_BUTTON_RECT.top - CUTOUT_PADDING)}px`)
    expect(cutout?.style.width).toBe(`${String(TRACE_BUTTON_RECT.width + CUTOUT_PADDING * 2)}px`)
    expect(cutout?.style.height).toBe(`${String(TRACE_BUTTON_RECT.height + CUTOUT_PADDING * 2)}px`)
  })

  it('말풍선은 대상 중심에 맞춰 서고 꼬리 끝이 구멍 위 24px에 선다', () => {
    restoreLayout = stubLayout({ 'trace-button': TRACE_BUTTON_RECT })

    renderOverlay(['trace-button'])

    const { bubble } = getOverlayParts()
    const targetCenterX = TRACE_BUTTON_RECT.left + TRACE_BUTTON_RECT.width / 2
    expect(bubble?.style.left).toBe(`${String(targetCenterX - BUBBLE_WIDTH / 2)}px`)
    expect(bubble?.style.top).toBe(
      `${String(TRACE_BUTTON_RECT.top - CUTOUT_PADDING - BUBBLE_HEIGHT - 24)}px`,
    )
  })

  // 탐색 탭은 화면 왼쪽에 있어 중심에 맞추면 말풍선이 화면 밖으로 나간다
  it('가장자리 대상이면 말풍선은 여백에서 멈추고 꼬리만 대상 중심에 남는다', async () => {
    restoreLayout = stubLayout({ 'book-tab': BOOK_TAB_RECT, 'trace-button': TRACE_BUTTON_RECT })
    renderOverlay(ALL_TARGET_NAMES)

    await goToLastStep()

    const { bubble } = getOverlayParts()
    const tail = bubble?.lastElementChild
    const targetCenterX = BOOK_TAB_RECT.left + BOOK_TAB_RECT.width / 2
    expect(bubble?.style.left).toBe('16px')
    expect(tail).toBeInstanceOf(HTMLElement)
    expect((tail as HTMLElement).style.marginLeft).toBe(`${String(targetCenterX - 16 - 10)}px`)
  })

  // 비활성 탭은 opacity-60이라 구멍만 뚫으면 흐린 채로 남는다
  it('비추는 동안 대상에 활성 표시를 붙였다가 떼어낸다', async () => {
    restoreLayout = stubLayout({ 'book-tab': BOOK_TAB_RECT, 'trace-button': TRACE_BUTTON_RECT })
    const { unmount } = renderOverlay(ALL_TARGET_NAMES)

    await goToLastStep()

    const target = document.querySelector('[data-home-coachmark-target="book-tab"]')
    expect(target?.getAttribute('data-home-coachmark-active')).toBe('true')

    unmount()

    expect(document.querySelector('[data-home-coachmark-active]')).toBeNull()
  })
})
