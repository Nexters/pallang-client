import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { COLLAPSE_DISTANCE } from '../_services/quoteCollapse.service'
import ReaderHighlightsPage from '../page'

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

// page의 params(Promise)를 use()가 동기적으로 언래핑하도록 status/value를 태깅한 thenable을 넘긴다.
function stubParams(id: string) {
  return Object.assign(Promise.resolve({ id }), { status: 'fulfilled' as const, value: { id } })
}

const passageSeedByPage: Record<
  number,
  { passageId: number; quotedText: string; isSpoiler: boolean }[]
> = {
  7: [
    { passageId: 71, quotedText: '첫 번째 대목 인용문', isSpoiler: false },
    { passageId: 72, quotedText: '두 번째 대목 인용문', isSpoiler: false },
  ],
  9: [{ passageId: 91, quotedText: '스포일러 대목 인용문', isSpoiler: true }],
}

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
}

// 대목 페이지 목록/페이지별 대목/대목별 흔적 API 응답을 흉내내고, 첫 페이지 탭이 그려질 때까지 기다린다.
// 반환값은 페이지가 그리는 첫 요소인 스크롤 컨테이너다.
async function renderPage(pages = [7, 9, 12, 23, 34, 123]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const pageMatch = /\/pages\/(\d+)\/passages/.exec(url)
      const opinionMatch = /\/passages\/(\d+)\/opinions/.exec(url)
      const opinions = opinionMatch ? (opinionSeedByPassage[Number(opinionMatch[1])] ?? []) : []
      const body = pageMatch
        ? { data: { passages: passageSeedByPage[Number(pageMatch[1])] ?? [] } }
        : opinionMatch
          ? {
              data: {
                opinions,
                pageInfo: {
                  page: 0,
                  size: 100,
                  totalElements: opinions.length,
                  totalPages: 1,
                  hasNext: false,
                },
              },
            }
          : { data: { pageNumbers: pages } }
      return Promise.resolve(new Response(JSON.stringify(body)))
    }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { container } = render(
    <QueryClientProvider client={client}>
      <ReaderHighlightsPage params={stubParams('1')} />
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
    expect(screen.getByText('해당 페이지부터는 로그인해야 확인할 수 있어요!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('로그인 상태에서 다른 페이지 탭을 누르면 바로 이동한다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    expect(
      screen.queryByText('해당 페이지부터는 로그인해야 확인할 수 있어요!'),
    ).not.toBeInTheDocument()
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('스포일러 하이라이트는 가림막을 먼저 보여주고, 누르면 내용을 보여준다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '9p' }))
    fireEvent.click(await screen.findByText('스포일러가 포함되어있어요!'))
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()
    expect(screen.getByText('스포일러 대목 인용문')).toBeInTheDocument()
  })

  it('로그인 상태에서 댓글 입력이 바로 열린다', async () => {
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()
  })

  it('비로그인 시 댓글 입력은 로그인 유도 팝업을 띄운다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: '흔적 남기기' }))
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
    expect(screen.getByText('해당 페이지부터는 로그인해야 확인할 수 있어요!')).toBeInTheDocument()
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
    expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
  })

  it('상세에서 다음 의견으로 이동할 수 있고, 첫 의견에서는 이전 버튼이 비활성화된다', async () => {
    await renderPage()

    fireEvent.click(await screen.findByText('첫 대목의 첫 번째 흔적'))
    const dialog = screen.getByRole('dialog', { name: '의견 상세' })

    expect(within(dialog).getByLabelText('이전 의견')).toBeDisabled()
    fireEvent.click(within(dialog).getByLabelText('다음 의견'))
    expect(within(dialog).getByText('밤의독서가')).toBeInTheDocument()
  })

  it('스크롤 진행률을 CSS 변수로 흘려보내고, 전환 도중에는 페이지 탭을 남겨둔다', async () => {
    const scroller = await renderPage()

    fireEvent.scroll(scroller, { target: { scrollTop: COLLAPSE_DISTANCE / 2 } })
    expect(scroller.style.getPropertyValue('--collapse')).toBe('0.5')
    expect(screen.getByRole('button', { name: '9p' })).toBeInTheDocument()
  })

  it('전환이 끝나면 페이지 탭이 사라지고, 최상단 복귀 시 다시 보인다', async () => {
    const scroller = await renderPage()

    fireEvent.scroll(scroller, { target: { scrollTop: COLLAPSE_DISTANCE } })
    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
    expect(screen.queryByRole('button', { name: '9p' })).not.toBeInTheDocument()

    fireEvent.scroll(scroller, { target: { scrollTop: 0 } })
    expect(scroller.style.getPropertyValue('--collapse')).toBe('0')
    expect(screen.getByRole('button', { name: '9p' })).toBeInTheDocument()
  })
})
