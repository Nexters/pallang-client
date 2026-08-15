import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import { FlatDialog } from './FlatDialog'

function renderFlatDialog(props: Partial<Parameters<typeof FlatDialog>[0]> = {}) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()

  render(
    <FlatDialog
      open
      title="회원 탈퇴하시겠어요?"
      description="복구가 불가능합니다."
      cancelLabel="취소"
      confirmLabel="탈퇴하기"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...props}
    />,
  )

  return { onCancel, onConfirm }
}

it('제목과 설명이 다이얼로그에 연결된다', async () => {
  renderFlatDialog()

  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveAccessibleName('회원 탈퇴하시겠어요?')
  expect(dialog).toHaveAccessibleDescription('복구가 불가능합니다.')
})

it('설명을 생략하면 설명 줄을 그리지 않는다', async () => {
  renderFlatDialog({ description: undefined })

  const dialog = await screen.findByRole('dialog')
  // 빈 설명 줄이 남으면 Header의 gap만큼 제목 아래가 벌어진다
  expect(dialog).toHaveAccessibleDescription('')
})

it('기본은 마스코트 일러스트를 얹고 그만큼 상단을 비운다', async () => {
  renderFlatDialog()

  const dialog = await screen.findByRole('dialog')
  expect(dialog.querySelector('[data-slot="dialog-illustration"]')).toBeInTheDocument()
  expect(dialog).toHaveClass('pt-[46px]')
})

it('illustrated=false면 일러스트를 걷고 상단 여백도 함께 줄인다', async () => {
  renderFlatDialog({ illustrated: false })

  const dialog = await screen.findByRole('dialog')
  expect(dialog.querySelector('[data-slot="dialog-illustration"]')).toBeNull()
  // 일러스트 자리로 잡아 둔 여백이 남으면 제목 위가 휑하게 뜬다
  expect(dialog).toHaveClass('pt-6')
  expect(dialog).not.toHaveClass('pt-[46px]')
})

it('취소와 확인이 각자의 핸들러를 부른다', async () => {
  const { onCancel, onConfirm } = renderFlatDialog()
  await screen.findByRole('dialog')

  fireEvent.click(screen.getByRole('button', { name: '취소' }))
  expect(onCancel).toHaveBeenCalledOnce()

  fireEvent.click(screen.getByRole('button', { name: '탈퇴하기' }))
  expect(onConfirm).toHaveBeenCalledOnce()
})

it('loading이면 확인 버튼만 잠긴다 — 취소는 열어 둔다', async () => {
  const { onCancel } = renderFlatDialog({ loading: true })
  await screen.findByRole('dialog')

  expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeDisabled()

  fireEvent.click(screen.getByRole('button', { name: '취소' }))
  expect(onCancel).toHaveBeenCalledOnce()
})

it('기본값에서는 Esc로 닫으면 취소로 친다', async () => {
  const { onCancel } = renderFlatDialog()
  const dialog = await screen.findByRole('dialog')

  fireEvent.keyDown(dialog, { key: 'Escape' })

  await waitFor(() => {
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

it('dismissible=false면 Esc로 빠져나갈 수 없다', async () => {
  const { onCancel, onConfirm } = renderFlatDialog({ dismissible: false })
  const dialog = await screen.findByRole('dialog')

  fireEvent.keyDown(dialog, { key: 'Escape' })

  // 둘 중 하나를 반드시 골라야 하는 다이얼로그다 — 닫히지도, 취소로 새지도 않는다
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  expect(onCancel).not.toHaveBeenCalled()
  expect(onConfirm).not.toHaveBeenCalled()
})
