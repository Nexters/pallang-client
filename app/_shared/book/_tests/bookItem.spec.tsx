import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { BookItem } from '../_components/BookItem/BookItem'

const ALADIN_COVER = 'https://image.aladin.co.kr/product/1/2/cover200/k12345.jpg'

function renderCover(coverImageUrl?: null | string) {
  const { container } = render(
    <BookItem author="지은이" coverImageUrl={coverImageUrl} title="제목" />,
  )
  const cover = container.querySelector<HTMLElement>('article > div[aria-hidden="true"]')
  if (!cover) throw new Error('표지 영역을 찾지 못했다')
  return cover
}

/**
 * happy-dom의 CSS 파서는 따옴표 안의 공백·괄호·작은따옴표까지 거부해(실제 브라우저는 받는다)
 * 인라인 스타일을 읽으면 정상 값도 빈 문자열로 나온다. 그래서 이스케이프 결과 자체를 본다.
 * 서버 마크업의 속성값은 HTML 이스케이프가 걸려 있으므로 되돌린 뒤 비교한다.
 */
function renderCoverStyleAttribute(coverImageUrl: string) {
  const markup = renderToStaticMarkup(
    <BookItem author="지은이" coverImageUrl={coverImageUrl} title="제목" />,
  )
  return markup.replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&')
}

describe('책 항목 표지', () => {
  it('표지 URL을 배경 이미지로 그린다', () => {
    expect(renderCover(ALADIN_COVER).style.backgroundImage).toBe(`url("${ALADIN_COVER}")`)
  })

  it('표지 URL이 없으면 배경 이미지를 지정하지 않는다', () => {
    expect(renderCover(null).style.backgroundImage).toBe('')
  })

  // url()을 끊는 문자가 든 표지 URL. 이스케이프가 없으면 선언이 조기 종료돼 표지가 통째로 사라진다.
  it.each([
    ['괄호', 'https://cdn.example.com/cover(1).jpg', 'https://cdn.example.com/cover(1).jpg'],
    ['공백', 'https://cdn.example.com/cover 1.jpg', 'https://cdn.example.com/cover 1.jpg'],
    ['작은따옴표', "https://cdn.example.com/it's.jpg", "https://cdn.example.com/it's.jpg"],
    ['큰따옴표', 'https://cdn.example.com/a"b.jpg', 'https://cdn.example.com/a\\"b.jpg'],
    ['역슬래시', 'https://cdn.example.com/a\\b.jpg', 'https://cdn.example.com/a\\\\b.jpg'],
    ['줄바꿈', 'https://cdn.example.com/a\nb.jpg', 'https://cdn.example.com/a%0Ab.jpg'],
  ])('URL에 %s가 있어도 url() 선언이 끊기지 않는다', (_name, coverImageUrl, expected) => {
    expect(renderCoverStyleAttribute(coverImageUrl)).toContain(
      `background-image:url("${expected}")`,
    )
  })
})
