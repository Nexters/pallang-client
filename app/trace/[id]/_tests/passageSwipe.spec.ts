import { describe, expect, it } from 'vitest'

import {
  isBackGestureEdge,
  resolveGestureAxis,
  resolveQuoteIndex,
  resolveSwipeDirection,
  resolveSwipeTarget,
} from '../_services/passageSwipe.service'

describe('resolveGestureAxis', () => {
  it('확정할 만큼 움직이지 않았으면 축을 정하지 않는다', () => {
    expect(resolveGestureAxis(4, 3)).toBeUndefined()
  })

  it('더 많이 움직인 쪽으로 축을 잠근다', () => {
    expect(resolveGestureAxis(-30, 6)).toBe('horizontal')
    expect(resolveGestureAxis(6, 30)).toBe('vertical')
  })

  it('대각선이 애매하면 세로로 본다 — 접힘 제스처를 함부로 가로채지 않는다', () => {
    expect(resolveGestureAxis(20, 20)).toBe('vertical')
  })
})

describe('resolveSwipeDirection', () => {
  it('임계에 못 미치는 드래그는 이동을 일으키지 않는다', () => {
    expect(resolveSwipeDirection(-20)).toBeUndefined()
  })

  it('손가락을 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전이다', () => {
    expect(resolveSwipeDirection(-60)).toBe('next')
    expect(resolveSwipeDirection(60)).toBe('prev')
  })
})

describe('isBackGestureEdge', () => {
  it('왼쪽 가장자리에서 시작한 터치는 iOS 뒤로가기에 넘긴다', () => {
    expect(isBackGestureEdge(8)).toBe(true)
    expect(isBackGestureEdge(200)).toBe(false)
  })
})

describe('resolveQuoteIndex', () => {
  it("'last'는 그 페이지의 마지막 대목으로 풀린다", () => {
    expect(resolveQuoteIndex('last', 3)).toBe(2)
  })

  it('대목이 아직 없으면 0으로 둔다', () => {
    expect(resolveQuoteIndex('last', 0)).toBe(0)
    expect(resolveQuoteIndex(2, 0)).toBe(0)
  })

  it('대목 수가 적은 페이지로 넘어오면 범위 안으로 좁힌다', () => {
    expect(resolveQuoteIndex(5, 2)).toBe(1)
  })
})

describe('resolveSwipeTarget', () => {
  const pages = [10, 20, 30]

  it('같은 페이지 안에서는 대목만 옮긴다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 0,
        quoteCount: 3,
        pages,
        activePage: 20,
      }),
    ).toEqual({ type: 'quote', quoteIndex: 1 })
    expect(
      resolveSwipeTarget({
        direction: 'prev',
        quoteIndex: 2,
        quoteCount: 3,
        pages,
        activePage: 20,
      }),
    ).toEqual({ type: 'quote', quoteIndex: 1 })
  })

  it('마지막 대목에서 넘기면 다음 페이지의 첫 대목으로 간다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 2,
        quoteCount: 3,
        pages,
        activePage: 20,
      }),
    ).toEqual({ type: 'page', page: 30, cursor: 0 })
  })

  it('첫 대목에서 뒤로 넘기면 이전 페이지의 마지막 대목으로 간다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'prev',
        quoteIndex: 0,
        quoteCount: 3,
        pages,
        activePage: 20,
      }),
    ).toEqual({ type: 'page', page: 10, cursor: 'last' })
  })

  it('불러온 범위의 처음과 끝에서는 더 넘어가지 않는다 — 순환하지 않는다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'prev',
        quoteIndex: 0,
        quoteCount: 3,
        pages,
        activePage: 10,
      }),
    ).toBeUndefined()
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 2,
        quoteCount: 3,
        pages,
        activePage: 30,
      }),
    ).toBeUndefined()
  })

  it('대목이 아직 도착하지 않은 페이지에서는 움직이지 않는다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 0,
        quoteCount: 0,
        pages,
        activePage: 20,
      }),
    ).toBeUndefined()
  })

  it('목록에 없는 페이지를 보고 있으면 인접 페이지를 특정하지 않는다', () => {
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 0,
        quoteCount: 1,
        pages,
        activePage: 99,
      }),
    ).toBeUndefined()
    expect(
      resolveSwipeTarget({
        direction: 'next',
        quoteIndex: 0,
        quoteCount: 1,
        pages,
        activePage: undefined,
      }),
    ).toBeUndefined()
  })
})
