import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'
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

type PassageSeed = {
  passageId: number
  quotedText: string
  isSpoiler: boolean
  decorations?: {
    decorationId: number
    startOffset: number
    endOffset: number
    effectType: string
    color: string
  }[]
}

const passageSeedByPage: Record<number, PassageSeed[]> = {
  7: [
    { passageId: 71, quotedText: '첫 번째 대목 인용문', isSpoiler: false },
    { passageId: 72, quotedText: '두 번째 대목 인용문', isSpoiler: false },
  ],
  // 효과가 입혀진 대목 — '의견 남기기'가 이 꾸밈을 이어받는다.
  // 효과는 인용문을 span으로 쪼개므로 본문을 글자로 찾는 테스트와 섞이지 않게 따로 둔다.
  8: [
    {
      passageId: 81,
      quotedText: '꾸며진 대목 인용문',
      isSpoiler: false,
      // 인용문 전체에 건다 — 일부만 걸면 본문이 span으로 쪼개져 글자로 찾을 수 없다
      decorations: [
        { decorationId: 9, startOffset: 0, endOffset: 10, effectType: 'WAVY', color: '#06D6A0' },
      ],
    },
  ],
  9: [{ passageId: 91, quotedText: '스포일러 대목 인용문', isSpoiler: true }],
  // 스포일러가 대목 단위임을 확인하기 위한 혼재 페이지
  12: [
    { passageId: 121, quotedText: '혼재 페이지의 일반 대목 인용문', isSpoiler: false },
    { passageId: 122, quotedText: '혼재 페이지의 스포일러 대목 인용문', isSpoiler: true },
  ],
  // 해제가 대목 단위인지 보려면 한 쪽에 스포일러가 둘 있어야 한다.
  // 첫 대목부터 스포일러라 스와이프 없이 바로 해제할 수 있다 —
  // 스와이프 뒤의 탭은 useQuoteSwipe가 삼켜(제스처 한 번 = 이동 한 번) 해제가 일어나지 않는다
  13: [
    { passageId: 131, quotedText: '연속 스포일러 첫 대목 인용문', isSpoiler: true },
    { passageId: 132, quotedText: '연속 스포일러 둘째 대목 인용문', isSpoiler: true },
  ],
  15: [{ passageId: 151, quotedText: '흔적이 많은 대목 인용문', isSpoiler: false }],
  // 쪽 목록 첫 묶음(100개) 밖에 있는 쪽 — 딥링크가 여기를 가리키는 경우를 만든다
  130: [{ passageId: 1301, quotedText: '먼 쪽의 대목 인용문', isSpoiler: false }],
  131: [{ passageId: 1311, quotedText: '먼 쪽 다음 쪽의 대목 인용문', isSpoiler: false }],
}

// 흔적 한 페이지(20개)를 넘겨 페이지네이션을 태우기 위한 시드
const manyOpinionSeed = Array.from({ length: 25 }, (_, index) => ({
  opinionId: 100 + index,
  userId: 5,
  nickname: '기록광',
  content: `많은 흔적 ${String(index + 1)}`,
  likeCount: 0,
  commentCount: 0,
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
    commentCount: number
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
      commentCount: 0,
      createdAt: '2026-07-23T02:00:00.000Z',
    },
    {
      opinionId: 2,
      userId: 2,
      nickname: '밤의독서가',
      content: '첫 대목의 두 번째 흔적',
      likeCount: 120,
      commentCount: 0,
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
      commentCount: 0,
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
      commentCount: 0,
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
      commentCount: 0,
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

/** 카드 위 좌우 스와이프 — 축이 가로로 잡히고 이동 임계를 넘길 만큼 끈다.
    리스너는 카드 버튼에 네이티브로 달려 있어 안쪽 인용문에서 시작해도 버블링으로 전달된다 */
function swipeCard(element: Element, direction: 'next' | 'prev') {
  const endX = direction === 'next' ? 140 : 260
  fireEvent.touchStart(element, { touches: [{ clientX: 200, clientY: 200 }] })
  fireEvent.touchMove(element, { touches: [{ clientX: endX, clientY: 200 }] })
  fireEvent.touchEnd(element, { touches: [] })
}

/** 관찰 중인 sentinel이 모두 화면에 들어온 것처럼 만든다 */
function scrollSentinelsIntoView() {
  act(() => {
    mountedObservers.forEach((observer) => {
      observer.emitIntersection()
    })
  })
}

// 대목 페이지 목록/페이지별 대목/대목별 흔적 API 응답을 흉내내고, 헤더 쪽 선택기가 그려질 때까지 기다린다.
// 반환값은 페이지가 그리는 첫 요소인 스크롤 컨테이너다.
/** 상세 오버레이로 들어가는 유일한 길인 딥링크 좌표(쪽 → 대목 → 흔적) */
type DeepLinkTarget = { pageNumber: number; passageId: number; opinionId: number }

async function renderPage(
  pages = [7, 9, 12, 13, 23, 34, 123],
  failing?: 'passages' | 'opinions',
  target?: DeepLinkTarget,
) {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const pageMatch = /\/pages\/(\d+)\/passages/.exec(url)
      if (pageMatch) {
        if (failing === 'passages') return Promise.resolve(new Response('{}', { status: 500 }))
        // 서버는 꾸밈을 언제나 배열로 준다(비어 있어도) — 시드에서 생략한 것도 그대로 맞춘다
        const passages = (passageSeedByPage[Number(pageMatch[1])] ?? []).map((passage) => ({
          ...passage,
          decorations: passage.decorations ?? [],
        }))
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

      // 책 제목·표지는 대목 페이지 목록 응답에 함께 실려 온다.
      // 쪽 목록도 페이지네이션된다 — 딥링크가 아직 안 받은 묶음의 쪽을 가리키는 경우를 만들려면 필요하다
      const pageQuery = new URLSearchParams(url.split('?')[1] ?? '')
      const pageSize = Number(pageQuery.get('size') ?? '100')
      const pageIndex = Number(pageQuery.get('page') ?? '0')
      const pageOffset = pageIndex * pageSize
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              bookTitle: '모순',
              pageNumbers: pages.slice(pageOffset, pageOffset + pageSize),
              pageInfo: {
                page: pageIndex,
                size: pageSize,
                totalElements: pages.length,
                totalPages: Math.ceil(pages.length / pageSize),
                hasNext: pageOffset + pageSize < pages.length,
              },
            },
          }),
        ),
      )
    }),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  const { container } = render(
    <QueryClientProvider client={client}>
      <HardwareBackProvider>
        <LoginGateProvider>
          <TraceCollapseView bookId={BOOK_ID} target={target} />
        </LoginGateProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
  // 쪽이 하나뿐이면 선택기 대신 라벨만 있는 알약이 서므로, 두 경우 모두 잡히는 현재 쪽 표시를
  // 기다린다. 딥링크로 들어오면 첫 쪽이 아니라 지목된 쪽에서 시작한다.
  await screen.findByText(`${String(target?.pageNumber ?? pages[0])}p`)
  return container.firstElementChild as HTMLElement
}

/** 우하단 남기기 버튼을 열고 그 갈래를 누른다 */
function clickFabAction(name: '의견 남기기' | '기록 남기기') {
  fireEvent.click(screen.getByRole('button', { name: '남기기' }))
  fireEvent.click(screen.getByRole('button', { name }))
}

/** 헤더의 쪽 선택기를 열어 그 쪽을 고른다 — 가로 페이지 탭 줄을 대신한다 */
async function selectPage(page: number) {
  // base-ui Select는 포인터 이벤트 시퀀스로 열고 고른다 — fireEvent.click 한 번으로는 선택되지 않는다
  await userEvent.click(screen.getByLabelText('쪽 선택'))
  await userEvent.click(await screen.findByRole('option', { name: `${String(page)}p` }))
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

  it('헤더 쪽 선택기는 API의 대목 페이지 목록으로 채운다', async () => {
    await renderPage([7, 200])

    fireEvent.click(screen.getByLabelText('쪽 선택'))
    expect(await screen.findByRole('option', { name: '200p' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '9p' })).not.toBeInTheDocument()
  })

  it('카드 인용문은 페이지별 대목 조회 API로 채우고, 좌우로 스와이프하면 다음 인용문으로 넘어간다', async () => {
    await renderPage()

    const firstQuote = await screen.findByText('첫 번째 대목 인용문')
    swipeCard(firstQuote, 'next')
    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()

    swipeCard(screen.getByText('두 번째 대목 인용문'), 'prev')
    expect(screen.getByText('첫 번째 대목 인용문')).toBeInTheDocument()
  })

  it('카드를 누르는 것만으로는 대목이 넘어가지 않는다 — 탭은 가림막 해제 몫이다', async () => {
    await renderPage()

    const firstQuote = await screen.findByText('첫 번째 대목 인용문')
    fireEvent.click(firstQuote)

    expect(screen.getByText('첫 번째 대목 인용문')).toBeInTheDocument()
    expect(screen.queryByText('두 번째 대목 인용문')).not.toBeInTheDocument()
  })

  it('터치가 없는 환경을 위해 카드 안 화살표로도 대목을 옮긴다', async () => {
    await renderPage()

    await screen.findByText('첫 번째 대목 인용문')
    fireEvent.click(screen.getByRole('button', { name: '다음 대목' }))
    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '이전 대목' }))
    expect(screen.getByText('첫 번째 대목 인용문')).toBeInTheDocument()
  })

  it('페이지의 마지막 대목에서 넘기면 다음 페이지의 첫 대목으로 이어진다', async () => {
    await renderPage()

    swipeCard(await screen.findByText('첫 번째 대목 인용문'), 'next')
    swipeCard(screen.getByText('두 번째 대목 인용문'), 'next')

    // 9p의 유일한 대목은 스포일러라 가림막부터 나온다
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('9p')
  })

  it('페이지의 첫 대목에서 뒤로 넘기면 이전 페이지의 마지막 대목으로 이어진다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    await selectPage(9)
    const spoilerCover = await screen.findByText('스포일러가 포함되어있어요!')

    swipeCard(spoilerCover, 'prev')

    expect(await screen.findByText('두 번째 대목 인용문')).toBeInTheDocument()
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('7p')
  })

  it('대목을 넘기면 열려 있던 댓글 입력바가 함께 닫힌다', async () => {
    await renderPage()
    await screen.findByText('첫 대목의 첫 번째 흔적')

    const toggle = screen.getAllByRole('button', { name: '댓글 보기' })[0]
    if (!toggle) throw new Error('댓글 보기 버튼을 찾지 못했다')
    fireEvent.click(toggle)
    expect(screen.getByPlaceholderText('답글을 입력해주세요')).toBeInTheDocument()

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')

    // 입력바는 blur 바깥의 fixed라, 남으면 목록에 없는 흔적에 댓글을 달 수 있다
    expect(screen.queryByPlaceholderText('답글을 입력해주세요')).not.toBeInTheDocument()
  })

  it('가림막이 걸린 대목에서는 댓글을 펼칠 수 없다', async () => {
    await renderPage()

    await selectPage(9)
    // 가림막 문구는 즉시 뜨지만 흔적 목록은 조회가 끝나야 그려진다
    await screen.findByText('스포일러 대목의 흔적')

    const toggle = screen.getAllByRole('button', { name: '댓글 보기' })[0]
    if (!toggle) throw new Error('댓글 보기 버튼을 찾지 못했다')
    fireEvent.click(toggle)

    // inert는 브라우저에만 있는 방어라 동작으로도 막혀 있어야 한다
    expect(screen.queryByPlaceholderText('답글을 입력해주세요')).not.toBeInTheDocument()
  })

  it('딥링크가 아직 안 받은 묶음의 쪽을 가리키면 그 쪽이 나올 때까지 쪽 목록을 이어 받는다', async () => {
    // 쪽 목록은 100개씩 온다 — 130쪽은 첫 묶음에 없다
    const manyPages = Array.from({ length: 150 }, (_, index) => index + 1)
    await renderPage(manyPages, undefined, { pageNumber: 130, passageId: 1301, opinionId: 9001 })

    // 보고 있는 쪽이 목록에 없으면 이웃 쪽을 특정할 수 없어 쪽 이동이 통째로 막힌다
    const quote = await screen.findByText('먼 쪽의 대목 인용문')
    swipeCard(quote, 'next')

    expect(await screen.findByText('먼 쪽 다음 쪽의 대목 인용문')).toBeInTheDocument()
  })

  it('책의 첫 대목에서 뒤로 넘겨도 끝으로 돌아가지 않는다', async () => {
    await renderPage()

    const firstQuote = await screen.findByText('첫 번째 대목 인용문')
    swipeCard(firstQuote, 'prev')

    expect(screen.getByText('첫 번째 대목 인용문')).toBeInTheDocument()
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('7p')
  })

  it('열람은 로그인을 요구하지 않는다 — 비로그인도 스와이프로 다음 쪽까지 넘어간다', async () => {
    authState.isAuthenticated = false
    await renderPage()

    swipeCard(await screen.findByText('첫 번째 대목 인용문'), 'next')
    swipeCard(screen.getByText('두 번째 대목 인용문'), 'next')

    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('9p')
  })

  it('흔적 목록은 선택된 대목의 흔적 조회 API 응답으로 그린다', async () => {
    await renderPage()

    expect(await screen.findByText('첫 대목의 첫 번째 흔적')).toBeInTheDocument()
    expect(screen.getByText('2개의 의견')).toBeInTheDocument()
    expect(screen.queryByText('두 번째 대목의 흔적')).not.toBeInTheDocument()
  })

  it('닉네임은 눌러도 갈 곳이 없어 조작 대상으로 내놓지 않는다', async () => {
    await renderPage()

    expect(await screen.findByText('책책책을읽자')).toBeInTheDocument()
    // 버튼으로 두면 키보드·보조기기가 누를 것을 권하는데 눌러도 아무 일도 일어나지 않는다
    expect(screen.queryByRole('button', { name: '책책책을읽자' })).not.toBeInTheDocument()
  })

  it('흔적이 한 페이지를 넘으면 헤더는 전체 개수를 보여주고 목록은 첫 페이지만 그린다', async () => {
    await renderPage([15])

    expect(await screen.findByText('많은 흔적 1')).toBeInTheDocument()
    expect(screen.getByText('25개의 의견')).toBeInTheDocument()
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

  it('흔적 조회에 실패하면 "0개의 의견" 대신 에러 상태를 보여준다', async () => {
    await renderPage([7, 9], 'opinions')

    expect(await screen.findByLabelText('흔적 목록 오류')).toBeInTheDocument()
    expect(screen.getByText(/앗! 흔적들이 도착하지 않았어요!/)).toBeInTheDocument()
    expect(screen.queryByText('0개의 의견')).not.toBeInTheDocument()
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

    swipeCard(await screen.findByText('첫 번째 대목 인용문'), 'next')
    expect(await screen.findByText('두 번째 대목의 흔적')).toBeInTheDocument()
    expect(screen.queryByText('첫 대목의 첫 번째 흔적')).not.toBeInTheDocument()
  })

  it('비로그인 시 흔적을 남기려 하면 로그인 유도 팝업이 뜨고, 로그인 페이지로 이동한다', async () => {
    authState.isAuthenticated = false
    await renderPage()
    // 대목이 도착해야 붙일 대상이 정해진다
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')
    expect(screen.getByText(LOGIN_GATE_MESSAGE.traceCreate)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))
    expect(pushMock).toHaveBeenCalledWith('/login')
    // 게이트는 루트 레이아웃에 있어 화면이 바뀌어도 살아 있다. 닫지 않으면 로그인 화면을 덮는다.
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.traceCreate)).not.toBeInTheDocument()
  })

  it('앞선 게이트의 문구가 다음 게이트에 남지 않는다', async () => {
    authState.isAuthenticated = false
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')
    expect(screen.getByText(LOGIN_GATE_MESSAGE.traceCreate)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    const like = (await screen.findAllByRole('button', { name: '좋아요' }))[0]
    if (!like) throw new Error('좋아요 버튼을 찾지 못했다')
    fireEvent.click(like)

    expect(screen.getByText(LOGIN_GATE_MESSAGE.like)).toBeInTheDocument()
    expect(screen.queryByText(LOGIN_GATE_MESSAGE.traceCreate)).not.toBeInTheDocument()
  })

  it('다른 쪽을 고르면 바로 이동한다', async () => {
    await renderPage()

    await selectPage(9)
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('스포일러 하이라이트는 가림막을 먼저 보여주고, 누르면 내용을 보여준다', async () => {
    await renderPage()

    await selectPage(9)
    fireEvent.click(await screen.findByText('스포일러가 포함되어있어요!'))
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()
    expect(screen.getByText('스포일러 대목 인용문')).toBeInTheDocument()
  })

  it('스포일러 대목의 흔적 목록은 가려지고, 가림막을 해제하면 함께 노출된다', async () => {
    await renderPage()

    await selectPage(9)
    const trace = await screen.findByText('스포일러 대목의 흔적')
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(trace.closest('ul')).toHaveAttribute('inert')
    expect(trace.closest('ul')?.className).toContain('blur')

    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    expect(trace.closest('ul')).not.toHaveAttribute('inert')
    expect(trace.closest('ul')?.className).not.toContain('blur')
  })

  // 가림막을 우회해 스포일러 원문을 보던 경로 — 딥링크로 지목돼도 상세가 열려선 안 된다
  it('가림막 해제 전에는 딥링크로 지목된 흔적도 상세로 열리지 않는다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 9, passageId: 91, opinionId: 4 })

    await screen.findByText('스포일러가 포함되어있어요!')
    expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()

    // 해제하면 지목된 흔적이 그제야 상세로 올라온다
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    expect(await screen.findByRole('dialog', { name: '의견 상세' })).toBeInTheDocument()
  })

  it('스포일러 대목이 섞인 페이지에서도 일반 대목을 보는 동안에는 가림막이 없다', async () => {
    await renderPage()

    await selectPage(12)
    const normalQuote = await screen.findByText('혼재 페이지의 일반 대목 인용문')
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()

    swipeCard(normalQuote, 'next')
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    expect(screen.getByText('혼재 페이지의 스포일러 대목 인용문')).toBeInTheDocument()
  })

  it('한 대목의 가림막을 해제해도 같은 쪽의 다른 스포일러 대목은 그대로 가려져 있다', async () => {
    await renderPage()

    await selectPage(13)
    await screen.findByText('스포일러가 포함되어있어요!')
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()

    // 해제가 쪽 단위로 남으면 아직 열어본 적 없는 다음 스포일러가 열린 채로 나온다
    swipeCard(screen.getByText('연속 스포일러 첫 대목 인용문'), 'next')

    expect(screen.getByText('연속 스포일러 둘째 대목 인용문')).toBeInTheDocument()
    expect(screen.getByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('한 번 해제한 대목으로 되돌아오면 다시 묻지 않는다', async () => {
    await renderPage()

    await selectPage(13)
    await screen.findByText('스포일러가 포함되어있어요!')
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))

    // 다음 대목에 갔다가 되돌아온다 — 한 번 연 대목을 다시 잠그면 오가기가 성가시다
    swipeCard(screen.getByText('연속 스포일러 첫 대목 인용문'), 'next')
    swipeCard(screen.getByText('연속 스포일러 둘째 대목 인용문'), 'prev')

    expect(screen.getByText('연속 스포일러 첫 대목 인용문')).toBeInTheDocument()
    expect(screen.queryByText('스포일러가 포함되어있어요!')).not.toBeInTheDocument()
  })

  it('쪽을 옮기면 해제가 풀린다 — 다른 쪽의 스포일러는 다시 묻는다', async () => {
    await renderPage()

    await selectPage(13)
    await screen.findByText('스포일러가 포함되어있어요!')
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))

    await selectPage(9)

    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
  })

  it('로그인 상태에서 의견 남기기를 누르면 보고 있는 대목을 물고 작성 화면으로 간다', async () => {
    await renderPage()
    // 대목이 도착해야 붙일 대상이 정해진다
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')

    const url = new URL(String(pushMock.mock.calls[0]?.[0]), 'http://localhost')
    expect(url.pathname).toBe('/trace/new')
    // 이 대목에 병합되도록 대목 정보가 함께 실린다
    expect(url.searchParams.get('passageId')).toBe('71')
    expect(url.searchParams.get('page')).toBe('7')
    expect(url.searchParams.get('quote')).toBe('첫 번째 대목 인용문')
    expect(url.searchParams.get('bookTitle')).toBe('모순')
  })

  it('의견 남기기는 대목의 꾸밈까지 함께 넘긴다 — 받는 쪽이 꾸미기를 건너뛰고 의견 작성부터 연다', async () => {
    await renderPage([8])
    await screen.findByText('꾸며진 대목 인용문')

    clickFabAction('의견 남기기')

    const url = new URL(String(pushMock.mock.calls[0]?.[0]), 'http://localhost')
    expect(url.searchParams.get('passageId')).toBe('81')
    expect(url.searchParams.get('deco')).toBe('0.10.WAVY.06D6A0')
  })

  it('꾸밈이 없는 대목에서는 꾸밈을 싣지 않는다 — 받는 쪽이 꾸미기부터 시작한다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')

    const url = new URL(String(pushMock.mock.calls[0]?.[0]), 'http://localhost')
    expect(url.searchParams.get('passageId')).toBe('71')
    expect(url.searchParams.has('deco')).toBe(false)
  })

  it('기록 남기기는 대목을 물지 않고 새 대목으로 보낸다 — 의견 남기기와 갈리는 지점이다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('기록 남기기')

    const url = new URL(String(pushMock.mock.calls[0]?.[0]), 'http://localhost')
    expect(url.pathname).toBe('/trace/new')
    expect(url.searchParams.get('bookTitle')).toBe('모순')
    expect(url.searchParams.get('passageId')).toBeNull()
  })

  it('남기기 버튼은 뷰포트가 아니라 앱 셸에 붙는다 — 넓은 화면에서 창 끝으로 떨어져 나가지 않게', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    const fab = screen.getByRole('button', { name: '남기기' }).parentElement

    expect(fab?.className).toContain('absolute')
    expect(fab?.className).not.toContain('fixed')
  })

  it('남기기 갈래는 접는 즉시 지워지지 않고 퇴장 전환을 마친 뒤 걷힌다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    fireEvent.click(screen.getByRole('button', { name: '남기기' }))
    expect(screen.getByRole('button', { name: '기록 남기기' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '남기기' }))
    // 접자마자 지우면 펼침만 애니메이션되고 접힘은 툭 끊긴다
    expect(screen.getByRole('button', { name: '기록 남기기' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '기록 남기기' })).not.toBeInTheDocument()
    })
  })

  it('비로그인 시 의견 남기기는 로그인 유도 팝업을 띄우고 이동하지 않는다', async () => {
    authState.isAuthenticated = false
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')

    expect(screen.getByText(LOGIN_GATE_MESSAGE.traceCreate)).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('정렬 드롭다운에서 인기순을 고르면 라벨이 바뀌고 서버 정렬(sortType)로 다시 조회한다', async () => {
    await renderPage()
    await screen.findByText('첫 대목의 첫 번째 흔적')

    const sortTrigger = screen.getByRole('combobox', { name: '정렬 기준' })
    expect(sortTrigger).toHaveTextContent('최신순')

    // base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다 — userEvent로 조작해야 한다
    await userEvent.click(sortTrigger)
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '인기순' }))

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: '정렬 기준' })).toHaveTextContent('인기순')
    })

    const requestedUrls = vi
      .mocked(fetch)
      .mock.calls.map(([url]) => url)
      .filter((url): url is string => typeof url === 'string')
    expect(
      requestedUrls.some((url) => url.includes('/opinions') && url.includes('sortType=LIKES')),
    ).toBe(true)
  })

  it('딥링크로 지목된 의견은 상세 오버레이로 열리고 X로 닫힌다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 7, passageId: 71, opinionId: 2 })

    const dialog = await screen.findByRole('dialog', { name: '의견 상세' })
    expect(within(dialog).getByText('밤의독서가')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByLabelText('닫기'))
    // 슬라이드 아웃 전환(MOTION_DURATION.slow) 동안은 내용을 유지한 채 남아 있다가 사라진다
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '의견 상세' })).not.toBeInTheDocument()
    })
  })

  it('상세 오버레이에는 이전/다음 의견 탐색이 없다 — 의견 전환은 목록 스크롤로만 한다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 7, passageId: 71, opinionId: 1 })

    const dialog = await screen.findByRole('dialog', { name: '의견 상세' })

    expect(within(dialog).queryByLabelText('이전 의견')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('다음 의견')).not.toBeInTheDocument()
  })

  it('아래로 스크롤 제스처 한 번에 접힘 전환이 완료된다', async () => {
    const scroller = await renderPage()

    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
  })

  it('접힌 상태에서도 좌우 스와이프로 대목을 넘긴다 — 흔적 목록이 함께 갱신된다', async () => {
    const scroller = await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')

    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()
    expect(await screen.findByText('두 번째 대목의 흔적')).toBeInTheDocument()
    // 접힘 상태는 유지된다 — 대목만 바뀐다
    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
  })

  it('접힌 상태에서 페이지를 넘기면 헤더 쪽 선택기도 그 쪽으로 맞춰진다', async () => {
    const scroller = await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')
    swipeCard(screen.getByText('두 번째 대목 인용문'), 'next')
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()

    fireEvent.wheel(scroller, { deltaY: -120 })
    await waitForCollapseAnimation()

    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('9p')
  })

  it('목록 최상단에서 위로 스크롤하면 펼침으로 돌아온다', async () => {
    const scroller = await renderPage()
    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    fireEvent.wheel(scroller, { deltaY: -120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('0')
  })

  it('목록 중간에서는 위로 스크롤해도 펼침으로 돌아가지 않는다', async () => {
    const scroller = await renderPage()
    fireEvent.wheel(scroller, { deltaY: 120 })
    await waitForCollapseAnimation()

    scroller.scrollTop = 100
    fireEvent.wheel(scroller, { deltaY: -120 })
    await waitForCollapseAnimation()

    expect(scroller.style.getPropertyValue('--collapse')).toBe('1')
  })

  it('상세 오버레이 안의 스크롤은 접힘 전환을 일으키지 않는다', async () => {
    const scroller = await renderPage(undefined, undefined, {
      pageNumber: 7,
      passageId: 71,
      opinionId: 1,
    })

    // 오버레이는 fixed지만 스크롤러의 자손이라 wheel이 스크롤러까지 버블링된다
    fireEvent.wheel(await screen.findByRole('dialog', { name: '의견 상세' }), { deltaY: 120 })
    await waitForCollapseAnimation()

    // 전환이 아예 일어나지 않아야 한다 — --collapse는 전환이 시작돼야 세팅된다
    expect(scroller.style.getPropertyValue('--collapse')).not.toBe('1')
  })
})
