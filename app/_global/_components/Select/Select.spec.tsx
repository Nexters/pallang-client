import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'

import { Select } from './Select'

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
]

// base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다(마우스 입력 기준).
// fireEvent.click 단발로는 hover 이벤트가 없어 선택이 무시되므로 userEvent로 조작한다.
const user = userEvent.setup()

it('선택된 옵션의 라벨을 트리거에 보여준다', () => {
  render(<Select label="정렬 기준" options={SORT_OPTIONS} defaultValue="latest" />)

  expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveTextContent('최신순')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})

it('트리거를 누르면 옵션 목록이 열린다', async () => {
  render(<Select label="정렬 기준" options={SORT_OPTIONS} defaultValue="latest" />)

  await user.click(screen.getByRole('combobox', { name: '정렬 기준' }))

  await screen.findByRole('listbox')
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
    '최신순',
    '인기순',
  ])
})

it('옵션을 고르면 onValueChange가 호출되고 팝업이 닫힌다', async () => {
  const handleValueChange = vi.fn()
  render(
    <Select
      label="정렬 기준"
      options={SORT_OPTIONS}
      defaultValue="latest"
      onValueChange={handleValueChange}
    />,
  )

  await user.click(screen.getByRole('combobox', { name: '정렬 기준' }))
  await screen.findByRole('listbox')

  await user.click(screen.getByRole('option', { name: '인기순' }))

  expect(handleValueChange).toHaveBeenCalledWith('popular')
  await waitFor(() => {
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

function ControlledSelect() {
  const [value, setValue] = useState('latest')

  return <Select label="정렬 기준" options={SORT_OPTIONS} value={value} onValueChange={setValue} />
}

it('controlled 값이 바뀌면 트리거 라벨도 따라간다', async () => {
  render(<ControlledSelect />)

  await user.click(screen.getByRole('combobox', { name: '정렬 기준' }))
  await screen.findByRole('listbox')
  await user.click(screen.getByRole('option', { name: '인기순' }))

  await waitFor(() => {
    expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveTextContent('인기순')
  })
})
