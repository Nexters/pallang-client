// 표지 Blob 다운로드 — 프록시 성공 시 Blob, 어떤 실패든 null(등록은 계속돼야 한다).

import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchCoverImageBlob } from '../_services/coverImage.service'

const COVER_URL = 'https://image.aladin.co.kr/product/cover.jpg'

describe('fetchCoverImageBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('프록시 경로에 URL을 인코딩해 요청하고 Blob을 돌려준다', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCoverImageBlob(COVER_URL)

    expect(fetchMock).toHaveBeenCalledWith(`/api/book-cover?url=${encodeURIComponent(COVER_URL)}`)
    expect(result).toBe(blob)
  })

  it('프록시가 실패 응답을 주면 null을 돌려준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    expect(await fetchCoverImageBlob(COVER_URL)).toBeNull()
  })

  it('네트워크 오류도 null로 삼킨다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    expect(await fetchCoverImageBlob(COVER_URL)).toBeNull()
  })
})
