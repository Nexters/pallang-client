import { describe, expect, it } from 'vitest'

import { resolveCommentEdit } from '../_services/commentEdit.service'

describe('resolveCommentEdit', () => {
  it('내용을 고쳤으면 그 내용을 보낸다', () => {
    expect(resolveCommentEdit('고친 댓글', '원래 댓글')).toBe('고친 댓글')
  })

  it('앞뒤 공백은 정리해서 보낸다', () => {
    expect(resolveCommentEdit('  고친 댓글  ', '원래 댓글')).toBe('고친 댓글')
  })

  it('원문과 같으면 보낼 것이 없다', () => {
    expect(resolveCommentEdit('원래 댓글', '원래 댓글')).toBeNull()
  })

  it('공백만 다르면 원문과 같은 것으로 본다 — 바뀐 것 없는 요청이 나가지 않는다', () => {
    expect(resolveCommentEdit('  원래 댓글  ', '원래 댓글')).toBeNull()
  })

  it('공백만 남긴 입력은 폐기한다 — 빈 댓글을 만들지 않는다', () => {
    expect(resolveCommentEdit('', '원래 댓글')).toBeNull()
    expect(resolveCommentEdit('   ', '원래 댓글')).toBeNull()
    expect(resolveCommentEdit('\n\t ', '원래 댓글')).toBeNull()
  })

  it('원문이 비어 있어도 공백만 남긴 입력은 폐기한다', () => {
    expect(resolveCommentEdit('   ', '')).toBeNull()
    expect(resolveCommentEdit('새로 쓴 내용', '')).toBe('새로 쓴 내용')
  })

  it('가운데 공백은 건드리지 않는다 — 사용자가 쓴 그대로 보낸다', () => {
    expect(resolveCommentEdit('고친  댓글', '고친 댓글')).toBe('고친  댓글')
  })
})
