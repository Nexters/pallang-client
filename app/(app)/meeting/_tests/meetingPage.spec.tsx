import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { MeetingPageView } from '../_components/MeetingPageView/MeetingPageView'

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => routerMock, usePathname: () => '/meeting' }))

const authState = vi.hoisted(() => ({
  status: 'authenticated',
}))
vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.status === 'authenticated',
    signOut: vi.fn(),
  }),
}))

const group = {
  groupId: 1,
  name: '고전 뽀개기',
  bookId: 7,
  bookTitle: '프랑켄슈타인',
  bookCoverImageUrl: null,
  memberCount: 7,
  capacity: 10,
  startDate: '2026-08-20',
  endDate: '2026-08-22',
  ended: false,
}
const members = {
  members: [1, 2, 3, 4, 5].map((userId) => ({
    userId,
    nickname: `m${String(userId)}`,
    profileImageUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-08-19T12:00:00',
  })),
  pageInfo: { page: 0, size: 5, totalElements: 7, totalPages: 2, hasNext: true },
}

type StubOptions = { listStatus?: number; inviteLinkStatus?: number }

/** 목록·멤버·초대 링크 API를 URL로 분기해 돌려준다. IntersectionObserver는 happy-dom에 없어 함께 끼운다(useLoadMoreOnVisible). */
function stubFetch(
  groups: (typeof group)[],
  { listStatus = 200, inviteLinkStatus = 200 }: StubOptions = {},
) {
  const json = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }))
  // customFetch(app/_global/_apis/customFetch.api.ts)는 항상 문자열 URL로 fetch를 호출한다
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/groups?')) {
      if (listStatus !== 200) return json({ title: 'AUTH_401_1', status: listStatus }, listStatus)
      return json({
        data: {
          groups,
          pageInfo: {
            page: 0,
            size: 20,
            totalElements: groups.length,
            totalPages: 1,
            hasNext: false,
          },
        },
      })
    }
    if (url.includes('/members')) return json({ data: members })
    if (url.includes('/invite-link')) {
      if (inviteLinkStatus !== 200)
        return json(
          { title: 'GROUP_403_1', status: inviteLinkStatus, detail: '모임장만' },
          inviteLinkStatus,
        )
      return json({ data: { groupId: 1, inviteCode: 'abc' } })
    }
    return json({}, 404)
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
      takeRecords = () => []
    },
  )
  return fetchMock
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <MeetingPageView />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  routerMock.push.mockReset()
  authState.status = 'authenticated'
  window.sessionStorage.clear()
})

describe('모임 탭', () => {
  it('불러오는 동안에도 헤더와 탭바는 남고 목록 자리만 골격이다', () => {
    stubFetch([])
    renderPage()
    expect(screen.getByRole('heading', { name: '모임' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '모임' })).toBeInTheDocument() // 탭바
    expect(screen.getByRole('status', { name: '모임을 불러오는 중' })).toBeInTheDocument()
  })
  it('모임이 없으면 빈 상태와 모임 만들기 버튼을 보여주고 헤더에 +가 없다', async () => {
    stubFetch([])
    renderPage()
    expect(await screen.findByText('아직 참여 중인 모임이 없어요!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '모임 만들기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '새 모임 만들기' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '모임 만들기' }))
    expect(routerMock.push).toHaveBeenCalledWith('/meeting/new')
  })
  it('비로그인이면 빈 상태를 보여주고 만들기는 로그인 게이트를 연다', async () => {
    authState.status = 'unauthenticated'
    stubFetch([])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '모임 만들기' }))
    expect(routerMock.push).not.toHaveBeenCalledWith('/meeting/new')
    expect(await screen.findByText('로그인하면 모임을 만들 수 있어요!')).toBeInTheDocument()
  })
  it('모임이 있으면 카드(이름·책·종료일·아바타 5개+N)와 헤더 +를 보여준다', async () => {
    const fetchMock = stubFetch([group])
    renderPage()
    expect(await screen.findByText('고전 뽀개기')).toBeInTheDocument()
    expect(screen.getByText('프랑켄슈타인')).toBeInTheDocument()
    expect(screen.getByText('2026.08.22까지')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '새 모임 만들기' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument()
    })
    expect(screen.getAllByRole('img', { name: /멤버/ })).toHaveLength(5)
    expect(
      fetchMock.mock.calls.some(([url]: string[]) =>
        (url ?? '').includes('/api/groups?page=0&size=20'),
      ),
    ).toBe(true)
    expect(
      fetchMock.mock.calls.some(([url]: string[]) =>
        (url ?? '').includes('/api/groups/1/members?page=0&size=5'),
      ),
    ).toBe(true)
  })
  it('보러가기는 모임 스코프 흔적 보기로 간다', async () => {
    stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: '보러가기' }))
    expect(routerMock.push).toHaveBeenCalledWith('/trace/7?groupId=1')
  })
  it('목록을 못 받으면 오류 상태와 다시 시도를 보여준다', async () => {
    stubFetch([], { listStatus: 500 })
    renderPage()
    // 문구는 <br/>로 '다시 시도해주세요!'와 한 <p>를 나눠 쓴다 — 정확 일치로는 잡히지 않는다
    expect(await screen.findByText(/모임을 불러오지 못했어요\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다시 시도하기/ })).toBeInTheDocument()
  })
  it('돌아오자마자 만들기 완료 스낵바를 한 번 띄운다', async () => {
    window.sessionStorage.setItem('pallang.meetingNotice', 'created')
    stubFetch([group])
    renderPage()
    expect(await screen.findByText('모임이 성공적으로 만들어졌어요!')).toBeInTheDocument()
  })
})

/** navigator 전체를 갈아끼우면 렌더 중 userAgent 등을 읽는 코드가 깨진다 — 필요한 멤버만 덮고 되돌린다 */
function defineNavigator(patch: Partial<Navigator>) {
  const originals = new Map<string, PropertyDescriptor | undefined>()
  for (const [key, value] of Object.entries(patch)) {
    originals.set(key, Object.getOwnPropertyDescriptor(window.navigator, key))
    Object.defineProperty(window.navigator, key, { configurable: true, value })
  }
  return () => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(window.navigator, key, descriptor)
      else Reflect.deleteProperty(window.navigator, key)
    }
  }
}

describe('더보기 시트', () => {
  it('···를 누르면 두 타일이 보인다', async () => {
    stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    expect(await screen.findByRole('heading', { name: '더보기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '초대 링크 보내기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '방 설정 변경하기' })).toBeInTheDocument()
  })
  it('방 설정 변경하기는 수정 화면으로 간다', async () => {
    stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    fireEvent.click(await screen.findByRole('button', { name: '방 설정 변경하기' }))
    expect(routerMock.push).toHaveBeenCalledWith('/meeting/1/edit')
  })
  it('시트를 열 때 초대 링크를 미리 받아 둔다', async () => {
    // 누를 때 받으면 그 사이 손짓(user activation)이 끊겨 OS 공유 시트가 뜨지 않는다
    const fetchMock = stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]: string[]) =>
          String(input).includes('/api/groups/1/invite-link'),
        ),
      ).toBe(true)
    })
    expect(screen.getByRole('button', { name: '초대 링크 보내기' })).toBeInTheDocument()
  })
  it('초대 링크 보내기는 초대 코드를 받아 OS 공유로 넘기고, 끝나면 시트를 닫는다', async () => {
    const share = vi.fn<(data?: ShareData) => Promise<void>>().mockResolvedValue(undefined)
    const restore = defineNavigator({ share })
    stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    fireEvent.click(await screen.findByRole('button', { name: '초대 링크 보내기' }))
    await waitFor(() => {
      expect(share).toHaveBeenCalled()
    })
    expect(share.mock.calls[0]?.[0]?.url).toMatch(/\/meeting\/invite\/abc$/)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '초대 링크 보내기' })).not.toBeInTheDocument()
    })
    restore()
  })
  it('공유 시트가 없으면 복사하고 알려준다', async () => {
    const restore = defineNavigator({
      share: undefined,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } as unknown as Clipboard,
    })
    stubFetch([group])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    fireEvent.click(await screen.findByRole('button', { name: '초대 링크 보내기' }))
    expect(await screen.findByText('초대 링크를 복사했어요.')).toBeInTheDocument()
    restore()
  })
  it('모임장이 아니면(403) 안내한다', async () => {
    stubFetch([group], { inviteLinkStatus: 403 })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /더보기/ }))
    fireEvent.click(await screen.findByRole('button', { name: '초대 링크 보내기' }))
    expect(await screen.findByText('모임장만 초대 링크를 보낼 수 있어요.')).toBeInTheDocument()
  })
})
