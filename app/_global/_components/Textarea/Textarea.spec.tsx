import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { Textarea } from './Textarea'

it('입력 길이에 따라 카운터가 갱신된다', () => {
  render(<Textarea placeholder="의견을 작성해주세요." />)

  expect(screen.getByText(/^0/)).toBeInTheDocument()

  fireEvent.change(screen.getByPlaceholderText('의견을 작성해주세요.'), {
    target: { value: '안녕하세요' },
  })

  expect(screen.getByText(/^5/)).toBeInTheDocument()
})
