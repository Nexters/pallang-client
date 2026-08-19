import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
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

/** 페이지마다 다른 도서를 돌려준다 — 두 번째 페이지가 실제로 붙는지 보려고 쓴다 */
function stubPagedApi() {
  const calls: string[] = []

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      const isFirstPage = !url.includes('page=1')
      calls.push(url)
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              books: [isFirstPage ? BOOK : NEXT_BOOK],
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
})
