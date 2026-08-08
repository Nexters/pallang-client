import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CameraCheck } from '../_components/CameraCheck/CameraCheck'

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({
    takePhoto: vi.fn().mockResolvedValue({ webPath: 'blob:test' }),
  }),
}))

describe('CameraCheck', () => {
  it('버튼을 누르면 촬영 결과 이미지를 보여준다', async () => {
    render(<CameraCheck />)
    fireEvent.click(screen.getByRole('button', { name: '사진 촬영' }))

    const img = await screen.findByAltText('촬영 결과')
    expect(img).toHaveAttribute('src', 'blob:test')
  })
})
