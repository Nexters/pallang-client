// 표지 프록시 허용 호스트 검증 — 임의 URL을 서버가 대신 fetch하는 SSRF 통로를 잠근다.

import { describe, expect, it } from 'vitest'

import { isAllowedCoverUrl } from './coverHost.service'

describe('isAllowedCoverUrl', () => {
  it('알라딘 이미지 도메인의 https URL만 허용한다', () => {
    expect(isAllowedCoverUrl('https://image.aladin.co.kr/product/cover.jpg')).toBe(true)
    expect(isAllowedCoverUrl('https://aladin.co.kr/cover.jpg')).toBe(true)
  })

  it('카카오 책 검색 썸네일 CDN의 https URL을 허용한다', () => {
    expect(
      isAllowedCoverUrl(
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F7070210',
      ),
    ).toBe(true)
  })

  it('카카오 책 검색 원본 표지(Daum CDN)의 https URL을 허용한다', () => {
    expect(
      isAllowedCoverUrl('https://t1.daumcdn.net/lbook/image/7070210?timestamp=20260915122501'),
    ).toBe(true)
  })

  it('다른 도메인은 거부한다 — 접미사 흉내도 막는다', () => {
    expect(isAllowedCoverUrl('https://evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://aladin.co.kr.evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://notaladin.co.kr/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://search1.kakaocdn.net.evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://evil.search1.kakaocdn.net/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://kakaocdn.net/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://t1.daumcdn.net.evil.com/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://evil.t1.daumcdn.net/cover.jpg')).toBe(false)
    expect(isAllowedCoverUrl('https://daumcdn.net/cover.jpg')).toBe(false)
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
