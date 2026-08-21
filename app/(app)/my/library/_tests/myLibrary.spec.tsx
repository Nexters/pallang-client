import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MyLibraryView } from '../_components/MyLibraryView/MyLibraryView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const BOOK = {
  bookId: 12,
  title: '만조를 기다리며',
  author: '지은이',
  publisher: '출판사',
  coverImageUrl: null,
  passageCount: 6,
  opinionCount: 17,
}

const NEXT_BOOK = { ...BOOK, bookId: 13, title: '모순' }

const PAGE_INFO = { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false }

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

/** 목록 끝 sentinel이 화면에 들어온 것처럼 만든다 */
async function scrollToListEnd() {
  await act(async () => {
    mountedObservers.forEach((observer) => {
      observer.emitIntersection()
    })
    // 트리거로 시작된 fetchNextPage가 마이크로태스크로 흘러가도록 한 틱 넘긴다
    await Promise.resolve()
  })
}

/** 서재 응답을 고정하고 실제로 나간 요청 url을 돌려준다 */
function stubApi(response: { body?: unknown; status?: number }) {
  const calls: string[] = []

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      calls.push(url)
      return Promise.resolve(
        new Response(JSON.stringify(response.body ?? { data: null }), {
          status: response.status ?? 200,
        }),
      )
    }),
  )

  return calls
}

type PagedApiOptions = {
  /** 0페이지에 실을 도서 — 빈 배열로 두면 "0페이지만 통째로 걸러진" 응답이 된다 */
  firstPageBooks?: (typeof BOOK)[]
  /** 그 페이지의 첫 요청만 500으로 떨어뜨린다. 재시도는 정상 응답을 받는다 */
  failFirstAttemptOnPage?: number
}

/** 페이지마다 다른 도서를 돌려준다 — 두 번째 페이지가 실제로 붙는지 보려고 쓴다 */
function stubPagedApi({ firstPageBooks = [BOOK], failFirstAttemptOnPage }: PagedApiOptions = {}) {
  const calls: string[] = []
  const alreadyFailed = new Set<number>()

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      calls.push(url)
      const isFirstPage = !url.includes('page=1')
      const page = isFirstPage ? 0 : 1
      if (page === failFirstAttemptOnPage && !alreadyFailed.has(page)) {
        alreadyFailed.add(page)
        return Promise.resolve(
          new Response(JSON.stringify({ title: 'SERVER_500' }), { status: 500 }),
        )
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              books: isFirstPage ? firstPageBooks : [NEXT_BOOK],
              pageInfo: { ...PAGE_INFO, hasNext: isFirstPage },
            },
          }),
        ),
      )
    }),
  )

  return calls
}

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MyLibraryView />
    </QueryClientProvider>,
  )
}

describe('내 서재 도서 목록', () => {
  afterEach(() => {
    mountedObservers.clear()
    vi.unstubAllGlobals()
  })

  it('서버가 준 도서를 제목·출판사·지은이·대목수·흔적수와 함께 보여준다', async () => {
    stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    expect(await screen.findByText('만조를 기다리며')).toBeInTheDocument()
    expect(screen.getByText('출판사 · 지은이')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  // 마이페이지 화면이라 흔적 수는 도서 전체(ALL)가 아니라 내가 남긴 것(MINE)으로 센다
  it('page 기반으로 첫 페이지를 내 흔적 수 기준으로 요청한다', async () => {
    const calls = stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    await screen.findByText('만조를 기다리며')
    expect(calls[0]).toBe('/api/books/my-library?opinionCountScope=MINE&page=0')
  })

  it('흔적을 남긴 책이 없으면 빈 상태를 보여준다', async () => {
    stubApi({ body: { data: { books: [], pageInfo: PAGE_INFO } } })
    renderView()

    expect(await screen.findByText('아직 흔적을 남긴 책이 없어요')).toBeInTheDocument()
  })

  // 비로그인 401은 정상 흐름이라 재시도하지 않는다 — 한 번만 나가고 바로 오류 자리로 간다
  it('401이면 재시도 없이 오류 상태를 보여준다', async () => {
    const calls = stubApi({ status: 401, body: { title: 'AUTH_401_1' } })
    renderView()

    expect(await screen.findByRole('button', { name: '다시 시도하기' })).toBeInTheDocument()
    expect(calls).toHaveLength(1)
  })

  it('불러오는 동안 목록 자리를 골격으로 채운다', () => {
    stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    // 셸(TopBar)은 로딩 분기 바깥이라 처음부터 있어야 한다
    expect(screen.getByRole('heading', { name: '내 서재' })).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('목록 끝이 보이면 다음 페이지를 이어 붙인다', async () => {
    const calls = stubPagedApi()
    renderView()
    await screen.findByText('만조를 기다리며')

    await scrollToListEnd()

    await waitFor(() => {
      expect(screen.getByText('모순')).toBeInTheDocument()
    })
    // 앞 페이지는 그대로 남고 뒷 페이지만 덧붙는다
    expect(screen.getByText('만조를 기다리며')).toBeInTheDocument()
    expect(calls).toEqual([
      '/api/books/my-library?opinionCountScope=MINE&page=0',
      '/api/books/my-library?opinionCountScope=MINE&page=1',
    ])
  })

  it('마지막 페이지에 닿으면 더 요청하지 않는다', async () => {
    const calls = stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()
    await screen.findByText('만조를 기다리며')

    await scrollToListEnd()

    expect(calls).toHaveLength(1)
  })

  it('도서를 누르면 그 책의 상세로 간다', async () => {
    stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    await screen.findByText('만조를 기다리며')
    expect(screen.getByRole('link')).toHaveAttribute('href', '/my/library/12')
  })

  // 목록이 남아 있으면 전체 오류 화면으로 넘어가지 않는다. 하단만 재시도 줄로 바꿔
  // 끊긴 무한 스크롤을 사용자가 되살릴 수 있게 한다.
  it('다음 페이지를 못 불러오면 목록을 지우지 않고 하단에 재시도 줄을 세운다', async () => {
    const calls = stubPagedApi({ failFirstAttemptOnPage: 1 })
    renderView()
    await screen.findByText('만조를 기다리며')

    await scrollToListEnd()

    expect(await screen.findByText('더 불러오지 못했어요.')).toBeInTheDocument()
    expect(screen.getByText('만조를 기다리며')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도하기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText('모순')).toBeInTheDocument()
    expect(calls).toEqual([
      '/api/books/my-library?opinionCountScope=MINE&page=0',
      '/api/books/my-library?opinionCountScope=MINE&page=1',
      '/api/books/my-library?opinionCountScope=MINE&page=1',
    ])
  })

  // 서버가 0페이지를 통째로 걸러내면(차단·스포일러) 목록은 비지만 다음 페이지는 남아 있다.
  // 여기서 빈 상태로 끝내면 sentinel이 사라져 남은 기록에 영영 닿지 못한다.
  it('첫 페이지가 비어도 다음 페이지가 남았으면 빈 상태로 끝내지 않는다', async () => {
    stubPagedApi({ firstPageBooks: [] })
    renderView()

    // sentinel이 붙어야 observer가 생긴다 — 첫 페이지가 도착했다는 신호로 쓴다
    await waitFor(() => {
      expect(mountedObservers.size).toBeGreaterThan(0)
    })
    expect(screen.queryByText('아직 흔적을 남긴 책이 없어요')).not.toBeInTheDocument()

    await scrollToListEnd()

    expect(await screen.findByText('모순')).toBeInTheDocument()
  })

  // 이미 받아 둔 페이지가 있으면 재시도해도 status는 error 그대로다 — 화면이 바뀌지 않으니
  // 버튼이 직접 진행을 알려야 한다. 느린 회선에서 연타를 막는 유일한 신호다.
  it('오류 화면에서 재시도하는 동안 버튼에 진행 표시를 남긴다', async () => {
    let finishRetry: ((response: Response) => void) | undefined
    let firstPageCalls = 0
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('page=1')) return Promise.resolve(json({ title: 'SERVER_500' }, 500))
        firstPageCalls += 1
        // 재시도가 부르는 두 번째 0페이지 요청은 매달아 둔다 — 진행 표시가 켜진 순간을 붙잡는다
        if (firstPageCalls > 1) {
          return new Promise<Response>((resolve) => {
            finishRetry = resolve
          })
        }
        return Promise.resolve(
          json({ data: { books: [], pageInfo: { ...PAGE_INFO, hasNext: true } } }),
        )
      }),
    )
    renderView()

    await waitFor(() => {
      expect(mountedObservers.size).toBeGreaterThan(0)
    })
    await scrollToListEnd()

    const retryButton = await screen.findByRole('button', { name: '다시 시도하기' })
    expect(retryButton).not.toHaveAttribute('aria-busy')

    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '다시 시도하기' })).toHaveAttribute(
        'aria-busy',
        'true',
      )
    })

    await act(async () => {
      finishRetry?.(json({ data: { books: [BOOK], pageInfo: PAGE_INFO } }))
      await Promise.resolve()
    })
    expect(await screen.findByText('만조를 기다리며')).toBeInTheDocument()
  })
})
