import { describe, expect, it } from 'vitest'

import { resolveCommentListView, resolveRetryAction } from '../_services/commentList.service'

describe('resolveCommentListView', () => {
  it('첫 로딩은 목록 자리를 대신한다', () => {
    expect(resolveCommentListView({ isPending: true, isError: false, count: 0 })).toBe('pending')
  })

  it('보여줄 게 하나도 없는 실패만 전체 오류로 간다', () => {
    expect(resolveCommentListView({ isPending: false, isError: true, count: 0 })).toBe('error')
  })

  it('받아둔 댓글이 있으면 실패해도 목록을 지우지 않는다', () => {
    // 여기서 'error'로 가면 더보기 한 번 실패에 보이던 첫 페이지가 통째로 사라진다
    expect(resolveCommentListView({ isPending: false, isError: true, count: 5 })).toBe('list')
  })

  it('성공했는데 비어 있으면 첫 댓글을 권하는 자리다', () => {
    expect(resolveCommentListView({ isPending: false, isError: false, count: 0 })).toBe('empty')
  })

  it('댓글이 하나라도 있으면 목록이다', () => {
    expect(resolveCommentListView({ isPending: false, isError: false, count: 1 })).toBe('list')
  })

  it('첫 로딩은 다른 어떤 상태보다 앞선다', () => {
    expect(resolveCommentListView({ isPending: true, isError: true, count: 0 })).toBe('pending')
  })
})

describe('resolveRetryAction', () => {
  it('더보기가 깨졌으면 이어 받을 페이지를 다시 부른다', () => {
    expect(resolveRetryAction({ isFetchNextPageError: true })).toBe('fetchNext')
  })

  it('배경 갱신이 깨졌으면 받아둔 페이지를 다시 부른다', () => {
    expect(resolveRetryAction({ isFetchNextPageError: false })).toBe('refetch')
  })
})
