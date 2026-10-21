// @vitest-environment node
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { GroupSummary } from '../_queries/group.queries'

const getMyGroups = vi.hoisted(() => vi.fn())
vi.mock('../_apis/_generated/group/group', () => ({ getMyGroups }))

const { groupQueries } = await import('../_queries/group.queries')

function group(groupId: number): GroupSummary {
  return {
    groupId,
    name: `모임 ${String(groupId)}`,
    bookId: 1,
    bookTitle: '책',
    bookCoverImageUrl: null,
    memberCount: 1,
    capacity: 4,
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    ended: false,
    isHost: true,
  }
}

describe('groupQueries.listAll', () => {
  it('다음 페이지가 없을 때까지 최대 크기로 이어 받아 한 배열로 편다', async () => {
    getMyGroups
      .mockResolvedValueOnce({
        data: { groups: [group(1), group(2)], pageInfo: { page: 0, hasNext: true } },
      })
      .mockResolvedValueOnce({
        data: { groups: [group(3)], pageInfo: { page: 1, hasNext: false } },
      })

    const groups = await new QueryClient().fetchQuery(groupQueries.listAll())

    expect(groups.map((g) => g.groupId)).toEqual([1, 2, 3])
    expect(getMyGroups.mock.calls).toEqual([[{ page: 0, size: 100 }], [{ page: 1, size: 100 }]])
  })

  it('목록 키 아래에 있어 목록을 지우면(모임 만들기 직후) 함께 지워진다', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(groupQueries.listAll().queryKey, [group(1)])

    queryClient.removeQueries({ queryKey: groupQueries.list().queryKey })

    expect(queryClient.getQueryData(groupQueries.listAll().queryKey)).toBeUndefined()
  })
})
