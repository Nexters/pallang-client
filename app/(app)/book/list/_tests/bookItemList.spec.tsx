import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import type { GroupSummary } from '@/app/_global/_queries/group.queries'

import { BookItemList } from '../_components/BookItemList/BookItemList'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}))
const authMock = vi.hoisted(() => ({ isAuthenticated: true }))
const { getMyGroups, getPageNumbers } = vi.hoisted(() => ({
  getMyGroups: vi.fn(),
  getPageNumbers: vi.fn(),
}))

vi.mock('next/navigation', () => ({ useRouter: () => routerMock }))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authMock.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authMock.isAuthenticated,
    signOut: vi.fn(),
  }),
}))
vi.mock('@/app/_global/_apis/_generated/group/group', () => ({ getMyGroups }))
vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({ getPageNumbers }))

const PUBLIC_BOOK = {
  bookId: 1,
  title: '싯다르타',
  author: '헤르만 헤세',
  publisher: '민음사',
  coverImageUrl: null,
  passageCount: 5,
  opinionCount: 9,
  hasPublicPassage: true,
}
const GROUP_ONLY_BOOK = {
  bookId: 44,
  title: '마션',
  author: '앤디 위어',
  publisher: 'RHK',
  coverImageUrl: 'https://image.test/mars.jpg',
  passageCount: 2,
  opinionCount: 2,
  hasPublicPassage: false,
}

function group(overrides: Partial<GroupSummary>): GroupSummary {
  return {
    groupId: 7,
    name: '회사 독서모임',
    bookId: GROUP_ONLY_BOOK.bookId,
    bookTitle: GROUP_ONLY_BOOK.title,
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

function mockMyGroups(groups: GroupSummary[]) {
  getMyGroups.mockResolvedValue({ data: { groups, pageInfo: { page: 0, hasNext: false } } })
}

function renderList(books: Parameters<typeof BookItemList>[0]['books']) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <BookItemList books={books} />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

function bookButton(title: string) {
  return screen.getByRole('button', { name: `${title} 흔적 보기` })
}

afterEach(() => {
  authMock.isAuthenticated = true
  getMyGroups.mockReset()
  getPageNumbers.mockReset()
  routerMock.push.mockReset()
})

describe('탐색 목록 — 모임에서만 읽는 책', () => {
  it('공개 대목이 있는 책은 지금처럼 흔적 화면 링크로 연다', () => {
    mockMyGroups([])
    renderList([PUBLIC_BOOK])

    expect(screen.getByRole('link', { name: '싯다르타 흔적 보기' })).toHaveAttribute(
      'href',
      '/trace/1',
    )
    expect(screen.queryByText('비공개 모임')).not.toBeInTheDocument()
  })

  it('남의 비공개 모임 책은 목록에서 비공개 모임으로 표시하고, 누르면 안내 모달을 띄운다', async () => {
    mockMyGroups([group({ bookId: 999 })])
    renderList([GROUP_ONLY_BOOK])

    expect(await screen.findByText('비공개 모임')).toBeVisible()
    fireEvent.click(bookButton('마션'))

    const dialog = await screen.findByRole('dialog', {
      name: '이 책은 비공개 모임에서 읽고 있어요',
    })
    expect(within(dialog).getByText(/해당 모임 멤버만 볼 수 있어요/)).toBeInTheDocument()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('안내 모달의 새 모임 개설하기는 보던 책을 채운 모임 만들기로 보낸다', async () => {
    mockMyGroups([])
    renderList([GROUP_ONLY_BOOK])

    fireEvent.click(bookButton('마션'))
    fireEvent.click(await screen.findByRole('button', { name: '새 모임 개설하기' }))

    expect(routerMock.push).toHaveBeenCalledWith('/meeting/new?bookId=44')
  })

  it('안내 모달의 공개로 의견 남기기는 모임 없이(공개로) 이 책의 기록 작성을 연다', async () => {
    mockMyGroups([])
    renderList([GROUP_ONLY_BOOK])

    fireEvent.click(bookButton('마션'))
    fireEvent.click(await screen.findByRole('button', { name: '공개로 의견 남기기' }))

    const href = String(routerMock.push.mock.calls[0]?.[0])
    const params = new URL(href, 'https://pallang.test').searchParams
    expect(href.startsWith('/trace/new?')).toBe(true)
    expect(params.get('bookId')).toBe('44')
    expect(params.get('bookTitle')).toBe('마션')
    expect(params.get('groupId')).toBeNull()
  })

  it('내 모임에서 읽는 책은 모임 이름을 달고, 누르면 그 모임 범위로 바로 연다', async () => {
    mockMyGroups([group({ groupId: 7, name: '회사 독서모임' })])
    renderList([GROUP_ONLY_BOOK])

    expect(await screen.findByText('회사 독서모임')).toBeVisible()
    fireEvent.click(bookButton('마션'))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/trace/44?groupId=7')
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('같은 책을 읽는 내 모임이 여럿이면 몇 개든 시트에 모두 띄우고(진행 중 먼저) 고른 모임으로 연다', async () => {
    mockMyGroups([
      group({ groupId: 1, name: '끝난 모임', ended: true }),
      group({ groupId: 2, name: '친구 모임' }),
      group({ groupId: 3, name: '가족 모임' }),
    ])
    renderList([GROUP_ONLY_BOOK])

    expect(await screen.findByText('외 2')).toBeVisible()
    fireEvent.click(bookButton('마션'))

    const sheet = await screen.findByRole('dialog', { name: '어느 모임 기록을 볼까요?' })
    const options = within(sheet).getAllByRole('button', { name: /모임/ })
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringContaining('친구 모임'),
      expect.stringContaining('가족 모임'),
      expect.stringContaining('끝난 모임'),
    ])

    fireEvent.click(within(sheet).getByRole('button', { name: /가족 모임/ }))
    expect(routerMock.push).toHaveBeenCalledWith('/trace/44?groupId=3')
  })

  it('비로그인은 내 모임을 조회하지 않고 안내 모달을 띄운다', async () => {
    authMock.isAuthenticated = false
    renderList([GROUP_ONLY_BOOK])

    expect(screen.getByText('비공개 모임')).toBeVisible()
    fireEvent.click(bookButton('마션'))

    expect(
      await screen.findByRole('dialog', { name: '이 책은 비공개 모임에서 읽고 있어요' }),
    ).toBeInTheDocument()
    expect(getMyGroups).not.toHaveBeenCalled()
  })

  it('공개 대목 수를 모르는 책은 누를 때 대목을 조회해 갈 곳을 정한다', async () => {
    mockMyGroups([])
    getPageNumbers.mockResolvedValue({
      data: { bookTitle: '마션', pageNumbers: [], pageInfo: { page: 0, hasNext: false } },
    })
    renderList([{ ...GROUP_ONLY_BOOK, hasPublicPassage: undefined }])

    fireEvent.click(bookButton('마션'))

    expect(
      await screen.findByRole('dialog', { name: '이 책은 비공개 모임에서 읽고 있어요' }),
    ).toBeInTheDocument()
    // groupId 없이(공개 대목만) 조회한다
    expect(getPageNumbers.mock.calls[0]?.[0]).toBe(44)
    expect(getPageNumbers.mock.calls[0]?.[1]).toMatchObject({ groupId: undefined })
  })

  it('조회해 보니 공개 대목이 있으면 흔적 화면으로 보낸다', async () => {
    getPageNumbers.mockResolvedValue({
      data: { bookTitle: '마션', pageNumbers: [12], pageInfo: { page: 0, hasNext: false } },
    })
    renderList([{ ...GROUP_ONLY_BOOK, hasPublicPassage: undefined }])

    fireEvent.click(bookButton('마션'))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith('/trace/44')
    })
    expect(getMyGroups).not.toHaveBeenCalled()
  })
})
