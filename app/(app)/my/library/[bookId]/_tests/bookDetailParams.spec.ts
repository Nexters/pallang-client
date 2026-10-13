import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BookDetailBoundary } from '../_components/BookDetailBoundary/BookDetailBoundary'

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next/navigation', () => ({ notFound: notFoundMock }))

// 이 스펙이 보는 건 params 검증뿐이라 클라이언트 화면은 자리표시자로 둔다
vi.mock('../_components/BookDetailView/BookDetailView', () => ({ BookDetailView: () => null }))

function open(bookId: string, searchParams: Record<string, string> = {}) {
  return BookDetailBoundary({
    params: Promise.resolve({ bookId }),
    searchParams: Promise.resolve(searchParams),
  })
}

describe('책 상세 params 경계', () => {
  beforeEach(() => {
    notFoundMock.mockClear()
  })

  // Number()로만 재면 '0x0c'는 12, '1e2'는 100, '012'는 12가 되어 같은 책이 별칭 URL로 열리고,
  // '-1'·'0'은 검증을 통과해 4xx가 나는 요청만 쏜다
  it.each(['0x0c', '1e2', ' 12 ', '+12', '12.0', '012', '-1', '0', 'abc', ''])(
    '십진수 양의 정수가 아닌 `%s`는 not-found로 보낸다',
    async (bookId) => {
      await expect(open(bookId)).rejects.toThrow('NEXT_NOT_FOUND')
      expect(notFoundMock).toHaveBeenCalled()
    },
  )

  it('양의 정수는 숫자로 바꿔 화면에 넘긴다', async () => {
    const element = await open('12')

    expect(notFoundMock).not.toHaveBeenCalled()
    expect(element).toMatchObject({ props: { bookId: 12 } })
  })

  // 내 서재가 (책, 모임) 단위라 어느 항목에서 들어왔는지가 탭 목록의 범위다
  it('모임 항목에서 들어오면 groupId를 화면에 넘긴다', async () => {
    const element = await open('12', { groupId: '4' })

    expect(element).toMatchObject({ props: { bookId: 12, groupId: 4 } })
  })

  it('groupId가 없거나 양의 정수가 아니면 전역 항목(null)으로 연다 — 책은 그대로 열린다', async () => {
    expect(await open('12')).toMatchObject({ props: { groupId: null } })
    expect(await open('12', { groupId: 'abc' })).toMatchObject({ props: { groupId: null } })
    expect(await open('12', { groupId: '0' })).toMatchObject({ props: { groupId: null } })
    expect(notFoundMock).not.toHaveBeenCalled()
  })
})
