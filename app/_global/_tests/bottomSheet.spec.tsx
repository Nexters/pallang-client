import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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
