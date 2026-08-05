// 표지 프록시 허용 호스트 검증 — 임의 URL을 서버가 대신 fetch하는 SSRF 통로를 잠근다.

import { describe, expect, it } from 'vitest'

import { isAllowedCoverUrl } from './coverHost.service'

describe('isAllowedCoverUrl', () => {
  it('알라딘 이미지 도메인의 https URL만 허용한다', () => {
    expect(isAllowedCoverUrl('https://image.aladin.co.kr/product/cover.jpg')).toBe(true)
    expect(isAllowedCoverUrl('https://aladin.co.kr/cover.jpg')).toBe(true)
  })

  it('다른 도메인은 거부한다 — 접미사 흉내도 막는다', () => {
    expect(isAllowedCoverUrl('https://evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://aladin.co.kr.evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://notaladin.co.kr/cover.jpg')).toBe(false)
  })

  it('https가 아니면 거부한다', () => {
    expect(isAllowedCoverUrl('http://image.aladin.co.kr/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('file:///etc/passwd')).toBe(false)
  })

  it('URL이 아니면 거부한다', () => {
    expect(isAllowedCoverUrl('image.aladin.co.kr/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('')).toBe(false)
  })
})
