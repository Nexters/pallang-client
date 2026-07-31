import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'

import { TraceCollapseView } from '../_components/TraceCollapseView/TraceCollapseView'
import { COLLAPSE_ANIMATION_MS } from '../_services/quoteCollapse.service'

const { pushMock, replaceMock, authState } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  authState: { isAuthenticated: true },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

vi.mock('@/app/_global/_providers/AuthProvider/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.isAuthenticated ? 'authenticated' : 'unauthenticated',
    isAuthenticated: authState.isAuthenticated,
    signOut: vi.fn(),
  }),
}))

// page는 서버 컴포넌트(프리페치 셸)라 브라우저 테스트에서는 그 안쪽 클라이언트 화면을 그대로 렌더한다.
const BOOK_ID = 1

const passageSeedByPage: Record<
  number,
  { passageId: number; quotedText: string; isSpoiler: boolean }[]
> = {
  7: [
    { passageId: 71, quotedText: '첫 번째 대목 인용문', isSpoiler: false },
    { passageId: 72, quotedText: '두 번째 대목 인용문', isSpoiler: false },
  ],
  9: [{ passageId: 91, quotedText: '스포일러 대목 인용문', isSpoiler: true }],
  // 스포일러가 대목 단위임을 확인하기 위한 혼재 페이지
  12: [
    { passageId: 121, quotedText: '혼재 페이지의 일반 대목 인용문', isSpoiler: false },
    { passageId: 122, quotedText: '혼재 페이지의 스포일러 대목 인용문', isSpoiler: true },
  ],
  15: [{ passageId: 151, quotedText: '흔적이 많은 대목 인용문', isSpoiler: false }],
}

// 흔적 한 페이지(20개)를 넘겨 페이지네이션을 태우기 위한 시드
const manyOpinionSeed = Array.from({ length: 25 }, (_, index) => ({
  opinionId: 100 + index,
  userId: 5,
  nickname: '기록광',
  content: `많은 흔적 ${String(index + 1)}`,
  likeCount: 0,
  createdAt: '2026-07-18T09:00:00.000Z',
}))

const opinionSeedByPassage: Record<
  number,
  {
    opinionId: number
    userId: number
    nickname: string
    content: string
    likeCount: number
    createdAt: string
  }[]
> = {
  71: [
    {
      opinionId: 1,
      userId: 1,
      nickname: '책책책을읽자',
      content: '첫 대목의 첫 번째 흔적',
      likeCount: 4,
      createdAt: '2026-07-23T02:00:00.000Z',
    },
    {
      opinionId: 2,
      userId: 2,
      nickname: '밤의독서가',
      content: '첫 대목의 두 번째 흔적',
      likeCount: 120,
      createdAt: '2026-07-21T09:00:00.000Z',
    },
  ],
  72: [
    {
      opinionId: 3,
      userId: 3,
      nickname: '모순덩어리',
      content: '두 번째 대목의 흔적',
      likeCount: 8,
      createdAt: '2026-07-20T09:00:00.000Z',
    },
  ],
  91: [
    {
      opinionId: 4,
      userId: 4,
      nickname: '결말을아는자',
      content: '스포일러 대목의 흔적',
      likeCount: 1,
      createdAt: '2026-07-19T09:00:00.000Z',
    },
  ],
  121: [
    {
      opinionId: 5,
      userId: 5,
      nickname: '느긋한독자',
      content: '혼재 페이지 일반 대목의 흔적',
      likeCount: 2,
      createdAt: '2026-07-18T09:00:00.000Z',
    },
  ],
  151: manyOpinionSeed,
}

// happy-dom의 IntersectionObserver는 실제로 교차를 감지하지 않아, 테스트가 직접 트리거할 수 있게 갈아끼운다.
const mountedObservers = new Set<MockIntersectionObserver>()

class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback
  private readonly targets = new Set<Element>()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    mountedObservers.add(this)
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
    mountedObservers.delete(this)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  emitIntersection() {
    const entries = [...this.targets].map(
      (target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry,
    )
    if (entries.length > 0) this.callback(entries, this as unknown as IntersectionObserver)
  }
}

/** 접힘/펼침 애니메이션(rAF 기반)이 끝날 때까지 act 안에서 기다린다 */
async function waitForCollapseAnimation() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, COLLAPSE_ANIMATION_MS + 150))
  })
}

/** 관찰 중인 sentinel이 모두 화면에 들어온 것처럼 만든다 */
function scrollSentinelsIntoView() {
  act(() => {
    mountedObservers.forEach((observer) => {
      observer.emitIntersection()
    })
  })
}

// 대목 페이지 목록/페이지별 대목/대목별 흔적 API 응답을 흉내내고, 첫 페이지 탭이 그려질 때까지 기다린다.
// 반환값은 페이지가 그리는 첫 요소인 스크롤 컨테이너다.
async function renderPage(pages = [7, 9, 12, 23, 34, 123], failing?: 'passages' | 'opinions') {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const pageMatch = /\/pages\/(\d+)\/passages/.exec(url)
      if (pageMatch) {
        if (failing === 'passages') return Promise.resolve(new Response('{}', { status: 500 }))
        const passages = passageSeedByPage[Number(pageMatch[1])] ?? []
        return Promise.resolve(new Response(JSON.stringify({ data: { passages } })))
      }

      const opinionMatch = /\/passages\/(\d+)\/opinions/.exec(url)
      if (opinionMatch) {
        if (failing === 'opinions') return Promise.resolve(new Response('{}', { status: 500 }))
        const seed = opinionSeedByPassage[Number(opinionMatch[1])] ?? []
        const query = new URLSearchParams(url.split('?')[1] ?? '')
        const size = Number(query.get('size') ?? '20')
        const page = Number(query.get('page') ?? '0')
        const offset = page * size
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                opinions: seed.slice(offset, offset + size),
                pageInfo: {
                  page,
                  size,
                  totalElements: seed.length,
                  totalPages: Math.ceil(seed.length / size),
                  hasNext: offset + size < seed.length,
                },
              },
            }),
          ),
        )
      }

      return Promise.resolve(new Response(JSON.stringify({ data: { pageNumbers: pages } })))
    }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  const { container } = render(
    <QueryClientProvider client={client}>
      <LoginGateProvider>
        <TraceCollapseView bookId={BOOK_ID} />
      </LoginGateProvider>
    </QueryClientProvider>,
  )
  await screen.findByRole('button', { name: `${String(pages[0])}p` })
  return container.firstElementChild as HTMLElement
}

describe('ReaderHighlightsPage', () => {
  beforeEach(() => {
    authState.isAuthenticated = true
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  afterEach(() => {
    mountedObservers.clear()
    vi.unstubAllGlobals()
  })

  it('페이지 탭은 API의 대목 페이지 목록으로 그린다', async () => {
    await renderPage([7, 200])

    expect(screen.getByRole('button', { name: '200p' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '9p' })).not.toBeInTheDocument()
  })

  it('카드 인용문은 페이지별 대목 조회 API로 채우고, 클릭하면 다음 인용문으로 넘어간다', async () => {
    await renderPage()

    const firstQuote = await screen.findByText('첫 번째 대목 인용문')
    fireEvent.click(firstQuote)
    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()
  })

  it('흔적 목록은 선택된 대목의 흔적 조회 API 응답으로 그린다', async () => {
    await renderPage()

    expect(await screen.findByText('첫 대목의 첫 번째 흔적')).toBeInTheDocument()
    expect(screen.getByText('2개의 흔적')).toBeInTheDocument()
    expect(screen.queryByText('두 번째 대목의 흔적')).not.toBeInTheDocument()
  })

  it('흔적이 한 페이지를 넘으면 헤더는 전체 개수를 보여주고 목록은 첫 페이지만 그린다', async () => {
    await renderPage([15])

    expect(await screen.findByText('많은 흔적 1')).toBeInTheDocument()
    expect(screen.getByText('25개의 흔적')).toBeInTheDocument()
    expect(screen.getByText('많은 흔적 20')).toBeInTheDocument()
    expect(screen.queryByText('많은 흔적 21')).not.toBeInTheDocument()
  })

  it('목록 끝에 닿으면 다음 흔적 페이지를 이어 붙여 전체를 탐색할 수 있다', async () => {
    await renderPage([15])
    await screen.findByText('많은 흔적 1')

    scrollSentinelsIntoView()

    expect(await screen.findByText('많은 흔적 25')).toBeInTheDocument()
    expect(screen.getByText('많은 흔적 1')).toBeInTheDocument()
  })

  it('흔적 조회에 실패하면 "0개의 흔적" 대신 에러 상태를 보여준다', async () => {
    await renderPage([7, 9], 'opinions')

    expect(await screen.findByLabelText('흔적 목록 오류')).toBeInTheDocument()
    expect(screen.getByText(/앗! 흔적들이 도착하지 않았어요!/)).toBeInTheDocument()
    expect(screen.queryByText('0개의 흔적')).not.toBeInTheDocument()
  })

  it('대목 조회에 실패해도 같은 에러 상태를 보여주고, 다시 시도하면 재조회한다', async () => {
    await renderPage([7, 9], 'passages')

    expect(await screen.findByLabelText('흔적 목록 오류')).toBeInTheDocument()

    const callsBeforeRetry = vi.mocked(fetch).mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: '다시 시도하기' }))
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsBeforeRetry)
  })

  it('인용문을 전환하면 해당 대목의 흔적 목록으로 갱신된다', async () => {
    await renderPage()

    fireEvent.click(await screen.findByText('첫 번째 대목 인용문'))
    expect(await screen.findByText('두 번째 대목의 흔적')).toBeInTheDocument()
    expect(screen.queryByText('첫 대목의 첫 번째 흔적')).not.toBeInTheDocument()
  })

  it('비로그인 시 다른 페이지 탭을 누르면 로그인 유도 팝업이 뜨고, 로그인 페이지로 이동한다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    expect(screen.getByText(LOGIN_GATE_MESSAGE.pageView)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))
    expect(pushMock).toHaveBeenCalledWith('/login')
    // 게이트는 루트 레이아웃에 있어 화면이 바뀌어도 살아 있다. 닫지 않으면 로그인 화면을 덮는다.
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.pageView)).not.toBeInTheDocument()
  })

  it('앞선 게이트의 문구가 다음 게이트에 남지 않는다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '흔적 남기기' }))
    expect(screen.getByText(LOGIN_GATE_MESSAGE.traceCreate)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    expect(screen.getByText(LOGIN_GATE_MESSAGE.pageView)).toBeInTheDocument()
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.traceCreate)).not.toBeInTheDocument()
  })

  it('로그인 상태에서 다른 페이지 탭을 누르면 바로 이동한다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.pageView)).not.toBeInTheDocument()
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('스포일러 하이라이트는 가림막을 먼저 보여주고, 누르면 내용을 보여준다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    fireEvent.click(await screen.findByText('스포일러가 포함되어있어요!'))
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()
    expect(screen.getByText('스포일러 대목 인용문')).toBeInTheDocument()
  })

  it('스포일러 대목이어도 흔적 목록은 가리지 않는다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    const trace = await screen.findByText('스포일러 대목의 흔적')
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(trace.closest('ul')).not.toHaveAttribute('aria-hidden')
    expect(trace.closest('ul')?.className).not.toContain('blur')
  })

  it('스포일러 대목이 섞인 페이지에서도 일반 대목을 보는 동안에는 가림막이 없다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '12p' }))
    const normalQuote = await screen.findByText('혼재 페이지의 일반 대목 인용문')
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()

    fireEvent.click(normalQuote)
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(screen.getByText('혼재 페이지의 스포일러 대목 인용문')).toBeInTheDocument()
  })

  it('로그인 상태에서 댓글 입력이 바로 열린다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()
  })

  it('비로그인 시 댓글 입력은 흔적 남기기 문구의 로그인 유도 팝업을 띄운다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    expect(screen.getByText(LOGIN_GATE_MESSAGE.traceCreate)).toBeInTheDocument()
  })

  it('정렬 버튼을 누르면 라벨이 토글되고 서버 정렬(sortType)로 다시 조회한다', async () => {
    await renderPage()
    await screen.findByText('첫 대목의 첫 번째 흔적')

    fireEvent.click(screen.getByRole('button', { name: '최신순' }))
    expect(screen.getByRole('button', { name: '좋아요순' })).toBeInTheDocument()

    const requestedUrls = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => url)
      .filter((url): url is string => typeof url === 'string')
    expect(
      requestedUrls.some((url) => url.includes('/opinions') && url.includes('sortType=LIKES')),
    ).toBe(true)
  })

  it('의견 클릭 시 상세 오버레이가 열리고 X로 닫힌다', async () => {
    await renderPage()

    fireEvent.click(await screen.findByText('첫 대목의 두 번째 흔적'))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })
    expect(within(dialog).getByText('밤의독서가')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByLabelText('닫기'))
    // 슬라이드 아웃 전환(MOTION_DURATION.slow) 동안은 내용을 유지한 채 남아 있다가 사라진다
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
    })
  })

  it('상세 오버레이에는 이전/다음 의견 탐색이 없다 — 의견 전환은 목록 스크롤로만 한다', async () => {
    await renderPage()

    fireEvent.click(await screen.findByText('첫 대목의 첫 번째 흔적'))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })

    expect(within(dialog).queryByLabelText('이전 의견')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('다음 의견')).not.toBeInTheDocument()
  })

  it('아래로 스크롤 제스처 한 번에 접힘 전환이 완료되고 페이지 탭이 사라진다', async () => {
    const scroller = await renderPage()

    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
    expect(screen.queryByRole('button', { name: '9p' })).not.toBeInTheDocument()
  })

  it('목록 최상단에서 위로 스크롤하면 펼침으로 돌아와 페이지 탭이 다시 보인다', async () => {
    const scroller = await renderPage()
    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    fireEvent.wheel(scroller, { deltaY: -120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('0')
    expect(screen.getByRole('button', { name: '9p' })).toBeInTheDocument()
  })

  it('목록 중간에서는 위로 스크롤해도 펼침으로 돌아가지 않는다', async () => {
    const scroller = await renderPage()
    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    scroller.scrollTop = 100
    fireEvent.wheel(scroller, { deltaY: -120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
    expect(screen.queryByRole('button', { name: '9p' })).not.toBeInTheDocument()
  })
})
