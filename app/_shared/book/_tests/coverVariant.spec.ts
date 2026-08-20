// 표지 변형 치환 — 알라딘 cover 변형만 cover500으로 키우고, 나머지는 원본 그대로 통과한다.

import { describe, expect, it } from 'vitest'

import { toLargeCoverUrl } from '../_services/coverVariant.service'

describe('toLargeCoverUrl', () => {
  it('알라딘 표지 URL의 cover200 세그먼트를 cover500으로 치환한다', () => {
    expect(
      toLargeCoverUrl('https://image.aladin.co.kr/product/39872/66/cover200/k242130313_1.jpg'),
    ).toBe('https://image.aladin.co.kr/product/39872/66/cover500/k242130313_1.jpg')
  })

  it('다른 크기 변형(cover150 등)도 cover500으로 치환한다', () => {
    expect(
      toLargeCoverUrl('https://image.aladin.co.kr/product/32/95/cover150/s062934786_1.jpg'),
    ).toBe('https://image.aladin.co.kr/product/32/95/cover500/s062934786_1.jpg')
  })

  it('이미 cover500이면 같은 URL을 돌려준다', () => {
    const url = 'https://image.aladin.co.kr/product/39872/66/cover500/k242130313_1.jpg'

    expect(toLargeCoverUrl(url)).toBe(url)
  })

  it('직접 업로드 표지(비알라딘 호스트)는 그대로 통과한다', () => {
    const url = 'https://api-dev.pallang.co.kr/images/book-covers/f9d61910.jpg'

    expect(toLargeCoverUrl(url)).toBe(url)
  })

  it('알라딘이어도 /product/ 경로가 아니면 그대로 통과한다', () => {
    const url = 'https://image.aladin.co.kr/img/cover200/banner.jpg'

    expect(toLargeCoverUrl(url)).toBe(url)
  })

  it('변형 세그먼트가 없는 알라딘 URL은 그대로 통과한다', () => {
    const url = 'https://image.aladin.co.kr/product/39872/66/cover/k242130313_1.jpg'

    expect(toLargeCoverUrl(url)).toBe(url)
  })

  it('파일명에 cover200이 들어가도 경로 세그먼트가 아니면 치환하지 않는다', () => {
    const url = 'https://image.aladin.co.kr/product/39872/66/cover/cover200.jpg'

    expect(toLargeCoverUrl(url)).toBe(url)
  })

  it('URL이 아닌 문자열은 그대로 통과한다', () => {
    expect(toLargeCoverUrl('')).toBe('')
    expect(toLargeCoverUrl('not-a-url')).toBe('not-a-url')
  })
})
