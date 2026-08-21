import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { AppBackProvider } from '@/app/_global/_providers/AppBackProvider/AppBackProvider'
import { LoginGateProvider } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { bookQueries } from '@/app/_global/_queries/book.queries'
import { userQueries } from '@/app/_global/_queries/user.queries'

import { TraceScreen } from '../_components/TraceScreen/TraceScreen'

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

/** 마지막으로 렌더한 화면의 캐시 */
let lastClient: QueryClient

async function renderPage(
  pages = [7, 9, 12, 13, 23, 34, 123],
  failing?: 'passages' | 'opinions',
  target?: DeepLinkTarget,
  groupId?: number,
) {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  // 입력바에서 그 자리에 등록한 의견 — 목록 갱신(invalidate) 후의 재조회에 실려 화면에 나타난다
  const createdOpinions: (typeof manyOpinionSeed)[number][] = []
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      // 의견 생성(POST /opinions) — 등록된 내용을 그 대목의 목록 앞에 붙인다
      if (init?.method === 'POST' && (url.split('?')[0] ?? '').endsWith('/opinions')) {
        // customFetch는 body를 JSON 문자열로 만든다 — BodyInit의 다른 갈래는 이 앱 경로에 없다
        const body = JSON.parse(init.body as string) as { passageId: number; content: string }
        createdOpinions.unshift({
          opinionId: 900 + createdOpinions.length,
          userId: 9,
          nickname: '나',
          content: body.content,
          likeCount: 0,
          commentCount: 0,
          createdAt: '2026-08-21T09:00:00.000Z',
        })
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { opinionId: 901, passageId: body.passageId, merged: true },
            }),
          ),
        )
      }

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
        const seed = [...createdOpinions, ...(opinionSeedByPassage[Number(opinionMatch[1])] ?? [])]
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
  lastClient = client
  // 로그인 게이트는 루트 레이아웃이 제공하므로 화면만 렌더하는 테스트에서는 직접 감싼다
  const { container } = render(
    <QueryClientProvider client={client}>
      <AppBackProvider>
        <LoginGateProvider>
          <TraceScreen bookId={BOOK_ID} target={target} groupId={groupId} />
        </LoginGateProvider>
      </AppBackProvider>
    </QueryClientProvider>,
  )
  // 빈 모임은 쪽 표시가 서지 않는다 — 카드의 남기러 가기 안내가 곧 로드 완료 신호다
  if (pages.length === 0) {
    await screen.findByText(/아직 모임에서 남긴/)
    return container.firstElementChild as HTMLElement
  }
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

  it('모임에 대목이 없으면 카드가 남기러 가기 안내로 바뀐다', async () => {
    await renderPage([], undefined, undefined, 55)

    expect(screen.getByText(/아직 모임에서 남긴 문장과/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '바로 남기러 가기' })).toBeInTheDocument()
    // 페이저는 "01 / 00"이 아니라 시안의 "01 / 01"로 선다
    expect(screen.getByLabelText('전체 1개 대목 중 1번째')).toBeInTheDocument()
  })

  it('바로 남기러 가기는 모임을 실은 기록 남기기 플로우로 보낸다', async () => {
    await renderPage([], undefined, undefined, 55)

    fireEvent.click(screen.getByRole('button', { name: '바로 남기러 가기' }))

    expect(pushMock).toHaveBeenCalledTimes(1)
    const href = pushMock.mock.calls[0]?.[0] as string
    expect(href).toContain('/trace/new')
    expect(href).toContain('groupId=55')
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
    expect(screen.getByPlaceholderText('댓글을 입력해주세요')).toBeInTheDocument()

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')

    // 입력바는 blur 바깥의 fixed라, 남으면 목록에 없는 흔적에 댓글을 달 수 있다
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
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
    expect(screen.queryByPlaceholderText('댓글을 입력해주세요')).not.toBeInTheDocument()
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

  it('대목 조회에 실패하면 카드 안과 목록 자리에 함께 에러를 세우고, 다시 시도하면 재조회한다', async () => {
    await renderPage([7, 9], 'passages')

    // 대목이 깨지면 passageId가 없어 흔적도 부를 수 없다 — 두 자리가 함께 실패한다
    expect(await screen.findByLabelText('흔적 목록 오류')).toBeInTheDocument()
    expect(screen.getByText(/문장을 불러오지 못했어요\./)).toBeInTheDocument()

    // 두 재시도 버튼은 같은 핸들러를 쓴다 — 카드 안쪽을 눌러도 목록까지 다시 부른다
    const callsBeforeRetry = vi.mocked(fetch).mock.calls.length
    const [cardRetry] = screen.getAllByRole('button', { name: '다시 시도하기' })
    if (cardRetry) fireEvent.click(cardRetry)
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

    fireEvent.click(screen.getByRole('button', { name: '로그인 하기' }))
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
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

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
  it('가림막 해제 전에는 딥링크로 지목된 흔적도 댓글 시트로 열리지 않는다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 9, passageId: 91, opinionId: 4 })

    await screen.findByText('스포일러가 포함되어있어요!')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // 해제하면 지목된 흔적이 그제야 시트로 올라온다
    fireEvent.click(screen.getByText('스포일러가 포함되어있어요!'))
    expect(await screen.findByRole('dialog', { name: /^댓글 \(/ })).toBeInTheDocument()
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

  it('로그인 상태에서 의견 남기기를 누르면 화면을 떠나지 않고 그 자리에 의견 입력바가 열린다', async () => {
    await renderPage()
    // 대목이 도착해야 붙일 대상이 정해진다
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')

    expect(screen.getByPlaceholderText('의견을 입력해주세요')).toBeInTheDocument()
    // 남기려고 연 자리다 — 열리는 즉시 입력할 수 있어야 한 번 더 누르지 않는다(#374)
    expect(screen.getByPlaceholderText('의견을 입력해주세요')).toHaveFocus()
    expect(pushMock).not.toHaveBeenCalled()
    // 남기기 버튼은 입력바와 같은 자리를 다투므로 입력바가 떠 있는 동안 사라진다
    expect(screen.queryByRole('button', { name: '남기기' })).not.toBeInTheDocument()
  })

  it('입력바에서 등록하면 보고 있는 대목과 꾸밈이 실려 그 자리에서 의견이 생성된다', async () => {
    await renderPage([8])
    await screen.findByText('꾸며진 대목 인용문')
    // 내 흔적 관리·서재를 먼저 보고 온 상황
    const myOpinionsKey = userQueries.opinionList().queryKey
    const libraryKey = bookQueries.myLibrary().queryKey
    lastClient.setQueryData(myOpinionsKey, { pages: [], pageParams: [] })
    lastClient.setQueryData(libraryKey, { pages: [], pageParams: [] })

    clickFabAction('의견 남기기')
    fireEvent.change(screen.getByPlaceholderText('의견을 입력해주세요'), {
      target: { value: '그 자리에서 남긴 의견' },
    })
    fireEvent.click(screen.getByRole('button', { name: '의견 등록' }))

    // 새 의견이 목록 갱신에 실려 나타난다 — 입력바는 등록이 끝나면 접힌다
    expect(await screen.findByText('그 자리에서 남긴 의견')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('의견을 입력해주세요')).not.toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()

    // 서버가 받은 내용이 씨앗을 물고 가던 때와 같다 — 보고 있는 대목에 병합, 꾸밈 유지
    const fetchMock = vi.mocked(globalThis.fetch)
    const postCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    if (!postCall) throw new Error('의견 생성 요청이 없다')
    const body = JSON.parse(postCall[1]?.body as string) as Record<string, unknown>
    expect(body['passageId']).toBe(81)
    expect(body['quotedText']).toBe('꾸며진 대목 인용문')
    expect(body['decorations']).toEqual([
      { startOffset: 0, endOffset: 10, effectType: 'WAVY', color: '#06D6A0' },
    ])
    expect(lastClient.getQueryState(myOpinionsKey)?.isInvalidated).toBe(true)
    expect(lastClient.getQueryState(libraryKey)?.isInvalidated).toBe(true)
  })

  it('입력바 바깥을 탭하면 등록 없이 입력바만 접힌다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    clickFabAction('의견 남기기')
    fireEvent.click(screen.getByRole('button', { name: '의견 입력 닫기' }))

    expect(screen.queryByPlaceholderText('의견을 입력해주세요')).not.toBeInTheDocument()
    // 남기기 버튼이 다시 선다
    expect(screen.getByRole('button', { name: '남기기' })).toBeInTheDocument()
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

  it('딥링크로 지목된 의견은 댓글 시트로 열리고 X로 닫힌다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 7, passageId: 71, opinionId: 2 })

    const sheet = await screen.findByRole('dialog', { name: /^댓글 \(/ })
    expect(within(sheet).getByText('밤의독서가')).toBeInTheDocument()

    fireEvent.click(within(sheet).getByLabelText('닫기'))
    // 닫으면 지목도 함께 풀린다 — 남아 있으면 시트가 곧바로 다시 올라온다
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('딥링크가 첫 묶음 밖의 의견을 가리키면 그 의견이 나올 때까지 목록을 이어 받아 시트로 연다', async () => {
    // 흔적은 20개씩 온다 — 21번째(opinionId 120)는 첫 묶음에 없다
    await renderPage([15], undefined, { pageNumber: 15, passageId: 151, opinionId: 120 })

    const sheet = await screen.findByRole('dialog', { name: /^댓글 \(/ })

    expect(within(sheet).getByText('많은 흔적 21')).toBeInTheDocument()
  })

  it('딥링크가 가리킨 의견이 끝까지 없으면 조용히 넘어가지 않고 알린다', async () => {
    await renderPage([15], undefined, { pageNumber: 15, passageId: 151, opinionId: 9999 })

    expect(
      await screen.findByText('그 흔적을 찾지 못했어요. 지워졌을 수 있어요.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('댓글 시트에는 이전/다음 의견 탐색이 없다 — 의견 전환은 목록으로 돌아가서 한다', async () => {
    await renderPage(undefined, undefined, { pageNumber: 7, passageId: 71, opinionId: 1 })

    const sheet = await screen.findByRole('dialog', { name: /^댓글 \(/ })

    expect(within(sheet).queryByLabelText('이전 의견')).not.toBeInTheDocument()
    expect(within(sheet).queryByLabelText('다음 의견')).not.toBeInTheDocument()
  })

  it('좌우 스와이프로 대목을 넘긴다 — 흔적 목록이 함께 갱신된다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')

    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()
    expect(await screen.findByText('두 번째 대목의 흔적')).toBeInTheDocument()
  })

  it('페이저 화살표는 스와이프와 똑같이 쪽 경계를 넘는다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    // 7쪽 첫 대목 = 불러온 범위의 맨 앞이라 갈 곳이 없다
    expect(screen.getByLabelText('이전 대목')).toBeDisabled()

    // 그 쪽의 마지막 대목을 지나 다음 쪽(9p)까지 화살표로만 이동한다
    fireEvent.click(screen.getByLabelText('다음 대목'))
    expect(screen.getByText('두 번째 대목 인용문')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('다음 대목'))
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()
    // 쪽이 바뀌면 헤더의 쪽 선택기도 그 쪽으로 따라간다
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('9p')

    // 9쪽은 대목이 하나뿐인데도 양쪽 화살표가 살아 있다 — 대목은 쪽을 가로질러 한 줄로 이어진다.
    // 세는 것만 쪽 안에서 다시 시작한다(01 / 01)
    expect(screen.getByLabelText('전체 1개 대목 중 1번째')).toBeInTheDocument()
    expect(screen.getByLabelText('다음 대목')).toBeEnabled()

    // 되돌아가면 스와이프와 같은 자리 — 앞 쪽의 마지막 대목에 내려앉는다
    expect(screen.getByLabelText('이전 대목')).toBeEnabled()
    fireEvent.click(screen.getByLabelText('이전 대목'))
    expect(await screen.findByText('두 번째 대목 인용문')).toBeInTheDocument()
    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('7p')
  })

  it('쪽이 하나뿐이고 대목도 하나면 양쪽 화살표가 모두 죽는다', async () => {
    await renderPage([8])
    await screen.findByText('꾸며진 대목 인용문')

    expect(screen.getByLabelText('이전 대목')).toBeDisabled()
    expect(screen.getByLabelText('다음 대목')).toBeDisabled()
  })

  it('페이지를 넘기면 헤더 쪽 선택기도 그 쪽으로 맞춰진다', async () => {
    await renderPage()
    await screen.findByText('첫 번째 대목 인용문')

    swipeCard(screen.getByText('첫 번째 대목 인용문'), 'next')
    swipeCard(screen.getByText('두 번째 대목 인용문'), 'next')
    expect(await screen.findByText('스포일러가 포함되어있어요!')).toBeInTheDocument()

    expect(screen.getByLabelText('쪽 선택')).toHaveTextContent('9p')
  })
})
