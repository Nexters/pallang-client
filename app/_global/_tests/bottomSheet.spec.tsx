import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

describe('BottomSheet', () => {
  it('open이 false면 렌더하지 않는다', () => {
    render(
      <BottomSheet open={false} title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('open이면 제목과 본문을 보여준다', () => {
    render(
      <BottomSheet open title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('새로운 흔적을 어떻게 남길까요?')).toBeInTheDocument()
    expect(screen.getByText('본문')).toBeInTheDocument()
  })

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Escape 키를 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('배경을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )

    // 백드롭은 역할도 이름도 없는 장식 요소라 쿼리로만 잡을 수 있다
    const backdrop = document.querySelector('[data-slot="bottom-sheet-backdrop"]')
    if (backdrop === null) throw new Error('바텀시트 백드롭을 찾지 못했다')
    await userEvent.click(backdrop)

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('열려도 닫기 버튼이 아니라 시트 자신이 포커스를 갖는다', async () => {
    render(
      <BottomSheet open title="제목" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )

    // 첫 tabbable(닫기 버튼)에 포커스가 가면 열자마자 링이 보인다
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus()
    })
  })

  it('기본은 닫기 버튼을 보여준다', () => {
    render(
      <BottomSheet open title="직접 입력" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )

    expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy()
  })

  it('onBack을 주면 제목 앞에 뒤로 버튼이 붙는다', () => {
    render(
      <BottomSheet open title="책 검색" onBack={vi.fn()} onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )

    expect(screen.getByRole('button', { name: '뒤로' })).toBeTruthy()
    // 뒤로는 한 층 걷어내는 길이고 닫기는 시트를 통째로 접는 길이라 함께 선다
    expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy()
  })

  describe('등장 전환', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    // 시트가 열린 채로 DOM에 꽂히는 경로(화면 자체가 시트인 첫 화면 · 탭바로 들어오는 진입)에서는
    // base-ui가 'starting'을 건너뛴다 — mounted 초기값이 open이라 닫힘→열림 경계가 없다.
    // 그 경로를 받는 것은 CSS @starting-style뿐이라, 시작값을 CSS로 들고 있는지가 곧 보장이다.
    // (happy-dom은 @starting-style을 계산하지 않아 실제 이동은 브라우저에서 확인한다.)
    it('열린 채로 꽂혀도 시작 위치를 CSS가 들고 있다', () => {
      render(
        <BottomSheet open title="새로운 기록을 어떻게 남길까요?" onClose={vi.fn()}>
          <p>본문</p>
        </BottomSheet>,
      )

      const backdrop = document.querySelector('[data-slot="bottom-sheet-backdrop"]')
      if (backdrop === null) throw new Error('바텀시트 백드롭을 찾지 못했다')

      expect(screen.getByRole('dialog').className).toContain('starting:translate-y-full')
      expect(backdrop.className).toContain('starting:opacity-0')
    })

    // 열림이 런타임에 토글되는 경로(시트 위에 시트를 얹는 경우 등)는 base-ui가 그대로 받는다.
    // base-ui는 'starting'을 다음 애니메이션 프레임에 걷어내므로, rAF를 붙잡아 두면
    // 첫 커밋 상태가 남아 시작 스타일이 붙었는지 확인할 수 있다.
    it('열림이 토글되면 base-ui가 시작 위치를 잡는다', () => {
      vi.stubGlobal('requestAnimationFrame', () => 1)
      vi.stubGlobal('cancelAnimationFrame', () => undefined)

      const sheet = (open: boolean) => (
        <BottomSheet open={open} title="직접 입력" onClose={vi.fn()}>
          <p>본문</p>
        </BottomSheet>
      )
      const { rerender } = render(sheet(false))
      rerender(sheet(true))

      expect(screen.getByRole('dialog')).toHaveAttribute('data-starting-style')
    })
  })

  it('footer는 본문 스크롤 영역 바깥에 그린다', () => {
    render(
      <BottomSheet
        open
        title="책 검색"
        popupClassName="h-[calc(100%-40px)]"
        contentClassName="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        footer={<button>등록하기</button>}
        onClose={vi.fn()}
      >
        <p>본문</p>
      </BottomSheet>,
    )

    const footerButton = screen.getByRole('button', { name: '등록하기' })
    // 스크롤 컨테이너 안에 들어가면 목록과 함께 밀려 올라간다
    expect(footerButton.closest('[data-slot="bottom-sheet-body"]')).toBeNull()
  })
})
