import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'

import { Button } from '@/app/_global/_components/Button/Button'

import { Dialog } from './Dialog'

function LoginDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="activated">다이얼로그 열기</Button>} />
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>로그인하면 확인 할 수 있어요!</Dialog.Title>
          <Dialog.Description>팔랑과 함께하고 더 많은 흔적을 확인해보세요.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close render={<Button variant="back">닫기</Button>} />
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}

it('트리거를 누르면 열리고 제목·설명이 다이얼로그에 연결된다', async () => {
  render(<LoginDialog />)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '다이얼로그 열기' }))

  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveAccessibleName('로그인하면 확인 할 수 있어요!')
  expect(dialog).toHaveAccessibleDescription('팔랑과 함께하고 더 많은 흔적을 확인해보세요.')
})

it('열려도 첫 버튼이 아니라 다이얼로그 자신이 포커스를 갖는다', async () => {
  render(<LoginDialog />)

  fireEvent.click(screen.getByRole('button', { name: '다이얼로그 열기' }))
  const dialog = await screen.findByRole('dialog')

  // 첫 tabbable(닫기 버튼)에 포커스가 가면 열자마자 링이 보인다
  await waitFor(() => {
    expect(dialog).toHaveFocus()
  })
})

it('Close 파트를 누르면 닫힌다', async () => {
  render(<LoginDialog />)

  fireEvent.click(screen.getByRole('button', { name: '다이얼로그 열기' }))
  await screen.findByRole('dialog')

  fireEvent.click(screen.getByRole('button', { name: '닫기' }))

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
