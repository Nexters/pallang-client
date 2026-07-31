import { afterEach, describe, expect, it, vi } from 'vitest'

import { fitWithin, OCR_MAX_EDGE, shrinkForOcr } from '@/app/_global/_services/photoResize.service'

describe('fitWithin', () => {
  it('긴 변이 상한 이하이면 그대로 둔다', () => {
    expect(fitWithin({ height: 900, width: 1200 }, 2400)).toEqual({ height: 900, width: 1200 })
  })

  it('가로가 긴 사진은 너비를 상한에 맞추고 비율을 지킨다', () => {
    expect(fitWithin({ height: 3024, width: 4032 }, 2400)).toEqual({ height: 1800, width: 2400 })
  })

  it('세로가 긴 사진은 높이를 상한에 맞춘다', () => {
    expect(fitWithin({ height: 4032, width: 3024 }, 2400)).toEqual({ height: 2400, width: 1800 })
  })

  it('상한과 같은 크기는 다시 줄이지 않는다', () => {
    expect(fitWithin({ height: 1200, width: OCR_MAX_EDGE }, OCR_MAX_EDGE)).toEqual({
      height: 1200,
      width: OCR_MAX_EDGE,
    })
  })
})

describe('shrinkForOcr', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 축소는 화질 최적화일 뿐이다. 실패했다고 촬영 흐름을 끊으면 안 된다.
  it('이미지 디코딩을 못 하는 환경이면 원본을 그대로 돌려준다', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    const blob = new Blob(['photo'], { type: 'image/jpeg' })

    expect(await shrinkForOcr(blob)).toBe(blob)
  })

  it('디코딩이 실패해도 원본을 그대로 돌려준다', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode failed')))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const blob = new Blob(['photo'], { type: 'image/jpeg' })

    expect(await shrinkForOcr(blob)).toBe(blob)
  })

  it('이미 상한보다 작은 사진은 다시 인코딩하지 않는다', async () => {
    const close = vi.fn()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ close, height: 800, width: 1000 }),
    )
    const blob = new Blob(['photo'], { type: 'image/jpeg' })

    expect(await shrinkForOcr(blob)).toBe(blob)
    expect(close).toHaveBeenCalled()
  })
})
