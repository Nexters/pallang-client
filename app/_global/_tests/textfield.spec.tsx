import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Textfield } from '../_components/Textfield/Textfield'

describe('Textfield', () => {
  it('라벨과 입력을 연결한다', () => {
    render(<Textfield label="제목" placeholder="책 제목을 입력해 주세요." />)
    expect(screen.getByLabelText('제목')).toBeTruthy()
  })

  it('필수 필드는 표시와 required 속성을 함께 준다', () => {
    render(<Textfield label="지은이" required />)
    const input = screen.getByLabelText(/지은이/)
    expect(input.hasAttribute('required')).toBe(true)
  })

  it('에러 메시지를 입력과 연결해 알린다', () => {
    render(<Textfield label="페이지 수" errorMessage="1 이상의 숫자를 입력해 주세요." />)
    const input = screen.getByLabelText('페이지 수')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('1 이상의 숫자를 입력해 주세요.')).toBeTruthy()
    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByText('1 이상의 숫자를 입력해 주세요.').id,
    )
  })
})
