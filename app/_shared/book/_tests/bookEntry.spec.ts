import { describe, expect, it } from 'vitest'

import type { GroupSummary } from '@/app/_global/_queries/group.queries'

import {
  findMyGroupsForBook,
  readHasPublicPassage,
  resolveBookEntry,
} from '../_data/bookEntry.model'

function group(overrides: Partial<GroupSummary>): GroupSummary {
  return {
    groupId: 1,
    name: '회사 독서모임',
    bookId: 44,
    bookTitle: '마션',
    bookCoverImageUrl: null,
    memberCount: 3,
    capacity: 4,
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    ended: false,
    isHost: false,
    ...overrides,
  }
}

describe('공개 대목 여부 읽기', () => {
  it('공개 대목 수가 있으면 1 이상일 때만 공개 기록이 있다고 본다', () => {
    expect(readHasPublicPassage({ bookId: 1, publicPassageCount: 3 })).toBe(true)
    expect(readHasPublicPassage({ bookId: 1, publicPassageCount: 0 })).toBe(false)
  })

  it('응답에 공개 대목 수가 없으면(최근 남긴 책, 필드 배포 전 서버) 모른다고 남긴다 — 0으로 읽어 막지 않는다', () => {
    expect(readHasPublicPassage({ bookId: 1 })).toBeUndefined()
  })
})

describe('이 책을 읽는 내 모임 찾기', () => {
  it('같은 책의 모임만 고르고, 진행 중인 모임을 끝난 모임보다 앞에 둔다', () => {
    const groups = [
      group({ groupId: 1, ended: true }),
      group({ groupId: 2, bookId: 99 }),
      group({ groupId: 3, ended: false }),
      group({ groupId: 4, ended: false }),
    ]

    expect(findMyGroupsForBook(groups, 44).map((g) => g.groupId)).toEqual([3, 4, 1])
  })
})

describe('책을 눌렀을 때 갈 곳', () => {
  it('공개 대목이 있으면 내 모임과 무관하게 공개 흔적으로 간다', () => {
    expect(resolveBookEntry({ hasPublicPassage: true, myGroups: [group({})] })).toEqual({
      kind: 'public',
    })
  })

  it('공개 대목이 없고 내 모임이 하나면 그 모임으로 바로 간다', () => {
    const mine = group({ groupId: 7 })
    expect(resolveBookEntry({ hasPublicPassage: false, myGroups: [mine] })).toEqual({
      kind: 'myGroup',
      group: mine,
    })
  })

  it('공개 대목이 없고 내 모임이 여럿이면 몇 개든 모두 골라 보게 한다', () => {
    const mine = [group({ groupId: 1 }), group({ groupId: 2 }), group({ groupId: 3 })]
    expect(resolveBookEntry({ hasPublicPassage: false, myGroups: mine })).toEqual({
      kind: 'pickGroup',
      groups: mine,
    })
  })

  it('공개 대목도 내 모임도 없으면 남의 비공개 모임 책으로 안내한다', () => {
    expect(resolveBookEntry({ hasPublicPassage: false, myGroups: [] })).toEqual({
      kind: 'privateGroup',
    })
  })
})
