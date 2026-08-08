import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OcrScanningOverlay } from './OcrScanningOverlay'

describe('OcrScanningOverlay', () => {
  it('인식 중 안내를 status로 알린다', () => {
    render(<OcrScanningOverlay />)
    expect(screen.getByRole('status')).toHaveTextContent('글자를 읽고 있어요')
  })
})
