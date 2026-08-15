import { describe, expect, it } from 'vitest'

import {
  buildTraceSeedHref,
  parseTraceSeed,
  type TraceSeed,
} from '@/app/_shared/trace/_data/traceSeed.model'

/** 링크로 나갔다가 쿼리로 돌아오는 왕복을 그대로 흉내낸다 */
function roundTrip(seed: TraceSeed): TraceSeed | null {
  const url = new URL(buildTraceSeedHref(seed), 'http://localhost')
  return parseTraceSeed(Object.fromEntries(url.searchParams))
}

const BOOK: TraceSeed = {
  bookId: 11,
  bookTitle: '모순',
  bookCoverImageUrl: 'https://example.com/cover.jpg',
  passage: null,
}

describe('흔적 작성 씨앗', () => {
  it('책만 담긴 씨앗이 왕복해도 그대로다', () => {
    expect(roundTrip(BOOK)).toEqual(BOOK)
  })

  it('대목까지 담긴 씨앗이 왕복해도 그대로다', () => {
    const seed: TraceSeed = {
      ...BOOK,
      passage: {
        passageId: 14,
        pageNumber: 178,
        // 공백·따옴표·개행이 섞인 인용문도 원문 그대로 돌아와야 한다
        quotedText: '가장 어두운 순간에도, 어딘가에는 "빛"이 있다.',
        isSpoiler: true,
        decorations: [],
      },
    }

    expect(roundTrip(seed)).toEqual(seed)
  })

  it('대목의 꾸밈까지 왕복한다 — 의견 남기기는 이 꾸밈을 이어받아 꾸미기 단계를 건너뛴다', () => {
    const seed: TraceSeed = {
      ...BOOK,
      passage: {
        passageId: 14,
        pageNumber: 178,
        quotedText: '가장 어두운 순간에도, 어딘가에는 빛이 있다.',
        isSpoiler: false,
        decorations: [
          { startOffset: 0, endOffset: 9, effectType: 'WAVY', color: '#06D6A0' },
          // 효과 이름에 밑줄이 있어도 구분자와 엉키지 않아야 한다
          { startOffset: 12, endOffset: 18, effectType: 'DOUBLE_LINE', color: '#FFD166' },
        ],
      },
    }

    expect(roundTrip(seed)).toEqual(seed)
  })

  it('꾸밈이 없으면 링크에 꾸밈 항목을 싣지 않는다', () => {
    const url = new URL(
      buildTraceSeedHref({
        ...BOOK,
        passage: {
          passageId: 14,
          pageNumber: 178,
          quotedText: '인용문',
          isSpoiler: false,
          decorations: [],
        },
      }),
      'http://localhost',
    )

    expect(url.searchParams.has('deco')).toBe(false)
  })

  it('서버가 16진수 대신 토큰 색을 줘도 이어받는다 — 실제로 #PRIMARY가 온다', () => {
    const seed = parseTraceSeed({
      bookId: '11',
      bookTitle: '모순',
      passageId: '14',
      page: '178',
      quote: '열두 글자인 인용문',
      deco: '0.3.HIGHLIGHT.PRIMARY',
    })

    expect(seed?.passage?.decorations).toEqual([
      { startOffset: 0, endOffset: 3, effectType: 'HIGHLIGHT', color: '#PRIMARY' },
    ])
  })

  it('인용문 밖을 가리키거나 형식이 깨진 꾸밈은 버린다 — 그대로 보내면 서버가 거절한다', () => {
    const base = {
      bookId: '11',
      bookTitle: '모순',
      passageId: '14',
      page: '178',
      quote: '열두 글자인 인용문',
    }

    const cases = [
      // 인용문(9자) 밖을 가리킨다
      '0.99.WAVY.06D6A0',
      // 시작이 끝보다 뒤다
      '5.2.WAVY.06D6A0',
      // 모르는 효과
      '0.3.SPARKLE.06D6A0',
      // 색이 비었다
      '0.3.WAVY.',
      // 색에 구분자·공백이 섞여 항목 경계를 흐린다
      '0.3.WAVY.a b',
      // 항목 수가 모자라다
      '0.3.WAVY',
    ]

    for (const deco of cases) {
      expect(parseTraceSeed({ ...base, deco })?.passage?.decorations).toEqual([])
    }
  })

  it('깨진 꾸밈이 섞여 있어도 멀쩡한 것은 남긴다', () => {
    const seed = parseTraceSeed({
      bookId: '11',
      bookTitle: '모순',
      passageId: '14',
      page: '178',
      quote: '열두 글자인 인용문',
      deco: '0.3.WAVY.06D6A0-0.99.CIRCLE.FFD166',
    })

    expect(seed?.passage?.decorations).toEqual([
      { startOffset: 0, endOffset: 3, effectType: 'WAVY', color: '#06D6A0' },
    ])
  })

  it('책이 없으면 씨앗으로 인정하지 않는다', () => {
    expect(parseTraceSeed({})).toBeNull()
    expect(parseTraceSeed({ bookTitle: '모순' })).toBeNull()
    expect(parseTraceSeed({ bookId: '11' })).toBeNull()
  })

  it('책 식별자가 양의 정수가 아니면 버린다', () => {
    for (const bookId of ['0', '-3', '1.5', 'abc', '1e2']) {
      expect(parseTraceSeed({ bookId, bookTitle: '모순' })).toBeNull()
    }
  })

  it('대목 정보가 덜 갖춰지면 책만 남기고 대목은 버린다', () => {
    // passageId만 있고 페이지·인용문이 없으면 붙일 대목을 특정할 수 없다
    const seed = parseTraceSeed({ bookId: '11', bookTitle: '모순', passageId: '14' })

    expect(seed?.bookId).toBe(11)
    expect(seed?.passage).toBeNull()
  })

  it('스포일러 표기가 없으면 가리지 않는다', () => {
    const seed = parseTraceSeed({
      bookId: '11',
      bookTitle: '모순',
      passageId: '14',
      page: '178',
      quote: '인용문',
    })

    expect(seed?.passage?.isSpoiler).toBe(false)
  })
})
