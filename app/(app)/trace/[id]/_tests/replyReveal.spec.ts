import { describe, expect, it } from 'vitest'

import {
  canRevealMoreReplies,
  hasReplyRevealError,
  resolveReplyRevealAction,
  resolveVisibleReplies,
} from '../_services/replyReveal.service'

const preview = ['미리보기1', '미리보기2']
const fetched = ['받아온1', '받아온2']

describe('resolveVisibleReplies', () => {
  it('접힌 단계에서는 아무것도 보이지 않는다', () => {
    expect(
      resolveVisibleReplies({ revealStep: 0, previewReplies: preview, fetchedReplies: fetched }),
    ).toEqual([])
  })

  it('1단계는 원댓글 응답이 준 미리보기만 보여준다', () => {
    // 접었다 편 뒤 남아 있는 캐시를 여기서 합치면 5개가 아니라 10개가 한 번에 나타난다
    expect(
      resolveVisibleReplies({ revealStep: 1, previewReplies: preview, fetchedReplies: fetched }),
    ).toEqual(preview)
  })

  it('2단계부터 미리보기 뒤로 받아온 답글이 이어 붙는다', () => {
    expect(
      resolveVisibleReplies({ revealStep: 2, previewReplies: preview, fetchedReplies: fetched }),
    ).toEqual([...preview, ...fetched])
  })

  it('아직 답글이 도착하지 않았어도 미리보기는 남는다', () => {
    expect(
      resolveVisibleReplies({ revealStep: 3, previewReplies: preview, fetchedReplies: [] }),
    ).toEqual(preview)
  })
})

describe('hasReplyRevealError', () => {
  it('요청을 켠 2단계부터의 실패만 재시도로 취급한다', () => {
    expect(hasReplyRevealError({ revealStep: 2, isError: true })).toBe(true)
  })

  it('접힌 상태에서 남아 있는 캐시의 에러는 끌어오지 않는다', () => {
    expect(hasReplyRevealError({ revealStep: 0, isError: true })).toBe(false)
    expect(hasReplyRevealError({ revealStep: 1, isError: true })).toBe(false)
  })

  it('실패가 없으면 언제나 false다', () => {
    expect(hasReplyRevealError({ revealStep: 3, isError: false })).toBe(false)
  })
})

describe('canRevealMoreReplies', () => {
  const base = {
    replyCount: 0,
    hasMoreReplies: false,
    hasNextPage: false,
    isPending: false,
    hasError: false,
  }

  it('접힌 단계에서는 답글이 하나라도 있으면 펼칠 수 있다', () => {
    expect(canRevealMoreReplies({ ...base, revealStep: 0, replyCount: 1 })).toBe(true)
    expect(canRevealMoreReplies({ ...base, revealStep: 0, replyCount: 0 })).toBe(false)
  })

  it('미리보기 뒤가 더 있는지는 서버의 hasMoreReplies만 본다', () => {
    // 개수로 추론하면(replyCount === 미리보기 개수) 버튼이 사라져 남은 답글에 닿을 수 없다
    expect(
      canRevealMoreReplies({ ...base, revealStep: 1, replyCount: 5, hasMoreReplies: true }),
    ).toBe(true)
    expect(
      canRevealMoreReplies({ ...base, revealStep: 1, replyCount: 99, hasMoreReplies: false }),
    ).toBe(false)
  })

  it('2단계부터는 다음 페이지가 남았을 때 버튼이 선다', () => {
    expect(canRevealMoreReplies({ ...base, revealStep: 2, hasNextPage: true })).toBe(true)
  })

  it('아직 못 받았거나 실패한 동안에도 버튼을 남긴다 — 사라지면 다시 시도할 길이 없다', () => {
    expect(canRevealMoreReplies({ ...base, revealStep: 2, isPending: true })).toBe(true)
    expect(canRevealMoreReplies({ ...base, revealStep: 2, hasError: true })).toBe(true)
  })

  it('마지막 페이지까지 받았으면 버튼을 거둔다', () => {
    expect(canRevealMoreReplies({ ...base, revealStep: 2, replyCount: 99 })).toBe(false)
  })
})

describe('resolveReplyRevealAction', () => {
  it('2단계 전까지는 요청 없이 단계만 올린다', () => {
    expect(resolveReplyRevealAction({ revealStep: 0, hasError: false })).toBe('expand')
    expect(resolveReplyRevealAction({ revealStep: 1, hasError: false })).toBe('expand')
  })

  it('첫 페이지가 실패했으면 이어 받지 않고 처음부터 다시 받는다', () => {
    // 되돌아갈 페이지가 없어 fetchNextPage로는 다시 받을 수 없다
    expect(resolveReplyRevealAction({ revealStep: 2, hasError: true })).toBe('refetch')
  })

  it('받아둔 페이지가 있으면 다음 페이지를 이어 받는다', () => {
    expect(resolveReplyRevealAction({ revealStep: 2, hasError: false })).toBe('fetchNext')
    expect(resolveReplyRevealAction({ revealStep: 3, hasError: false })).toBe('fetchNext')
  })
})
