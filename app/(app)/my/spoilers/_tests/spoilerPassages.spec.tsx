import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SpoilerPassagesView } from '../_components/SpoilerPassagesView/SpoilerPassagesView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const PASSAGE = {
  passageId: 91,
  bookId: 3,
  opinionId: 404,
  pageNumber: 128,
  quotedText: '진진이는 그 문장을 끝내 소리 내어 읽지 못했다.',
  isSpoiler: true,
  createdAt: '2026-08-10T00:00:00Z',
}

/** 2페이지에만 있는 대목 — 이어받기가 실제로 돌았는지 이 문장으로 본다 */
const NEXT_PAGE_PASSAGE = {
  ...PASSAGE,
  passageId: 92,
  pageNumber: 260,
  quotedText: '두 번째 페이지의 대목입니다.',
}

/** 5번 책의 유일한 스포일러 — 해제하면 도서 필터에서 그 책이 통째로 빠진다 */
const BOOK_5_PASSAGE = {
  ...PASSAGE,
  passageId: 95,
  bookId: 5,
  pageNumber: 300,
  quotedText: '만조를 기다리는 문장입니다.',
}

const BOOKS = [
  { bookId: 3, title: '모순' },
  { bookId: 5, title: '만조를 기다리며' },
]

type ListPage = { passages: (typeof PASSAGE)[]; hasNext: boolean }

/** 목록 한 페이지. hasNext를 주면 뒤에 더 있다고 알린다 */
function page(passages: (typeof PASSAGE)[], hasNext = false): ListPage {
  return { passages, hasNext }
}

type StubOptions = {
  /** 페이지 0부터 순서대로 */
  pages?: ListPage[]
  releaseStatus?: number
  books?: typeof BOOKS
  /** 해제가 성공한 뒤 도서 필터가 주는 책 — 고른 책이 목록에서 빠지는 상황을 만든다 */
  booksAfterRelease?: typeof BOOKS
  /** 2페이지 이후 요청을 몇 번 실패시킬지 */
  failNextPageTimes?: number
  /** bookId를 건 목록 요청을 응답 없이 붙잡아 둔다 — 필터 전환 도중의 화면을 보려면 필요하다 */
  holdFilteredList?: boolean
}

/** 오간 요청을 순서대로 담는다 — 필터가 서버까지 갔는지, 해제가 무엇을 보냈는지 여기서 본다 */
function stubApi({
  pages = [page([PASSAGE])],
  releaseStatus = 200,
  books = BOOKS,
  booksAfterRelease,
  failNextPageTimes = 0,
  holdFilteredList = false,
}: StubOptions = {}) {
  const requests: { url: string; method: string; body?: string }[] = []
  // 해제가 성공하면 서버처럼 목록에서 빼야 무효화 뒤 카드가 사라지는 걸 볼 수 있다
  let current = pages
  let currentBooks = books
  let failuresLeft = failNextPageTimes
  const held: (() => void)[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const body = typeof options?.body === 'string' ? options.body : undefined
      requests.push({ url, method: options?.method ?? 'GET', body })

      if (url.includes('/spoiler')) {
        if (releaseStatus !== 200) {
          return Promise.resolve(new Response('{}', { status: releaseStatus }))
        }
        const released = Number(/passages\/(\d+)\/spoiler/.exec(url)?.[1])
        current = current.map((listPage) => ({
          ...listPage,
          passages: listPage.passages.filter((passage) => passage.passageId !== released),
        }))
        if (booksAfterRelease) currentBooks = booksAfterRelease
        return Promise.resolve(
          new Response(JSON.stringify({ data: { passageId: released, isSpoiler: false } })),
        )
      }
      if (url.includes('/filter-books')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { books: currentBooks } })))
      }

      const query = new URL(url, 'http://test.local').searchParams
      const pageNumber = Number(query.get('page') ?? '0')
      if (pageNumber > 0 && failuresLeft > 0) {
        failuresLeft -= 1
        return Promise.resolve(new Response('{}', { status: 500 }))
      }
      const source = current[pageNumber] ?? page([])
      // 서버가 거는 필터를 그대로 흉내 낸다 — 되돌아간 필터가 목록까지 풀었는지 여기서 갈린다
      const bookId = query.get('bookId')
      const passages =
        bookId === null
          ? source.passages
          : source.passages.filter((passage) => String(passage.bookId) === bookId)

      const respond = () =>
        new Response(
          JSON.stringify({
            data: {
              passages,
              pageInfo: {
                page: pageNumber,
                size: 20,
                totalElements: passages.length,
                totalPages: current.length,
                hasNext: source.hasNext,
              },
            },
          }),
        )

      if (holdFilteredList && bookId !== null) {
        return new Promise<Response>((resolve) => {
          held.push(() => {
            resolve(respond())
          })
        })
      }
      return Promise.resolve(respond())
    }),
  )

  /** 붙잡아 둔 목록 응답을 한꺼번에 흘려보낸다 */
  const resumeHeldList = async () => {
    await act(async () => {
      held.splice(0).forEach((resume) => {
        resume()
      })
      // 응답을 받은 쿼리가 렌더까지 가도록 마이크로태스크를 한 번 넘긴다
      await Promise.resolve()
    })
  }

  return { requests, resumeHeldList }
}

/** happy-dom에는 IntersectionObserver가 없다. sentinel이 보였다고 알릴 수 있게 갈아 끼운다 */
function stubIntersectionObserver() {
  const live = new Set<IntersectionObserverCallback>()

  class IntersectionObserverStub {
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe() {
      live.add(this.callback)
    }
    unobserve() {
      live.delete(this.callback)
    }
    disconnect() {
      live.delete(this.callback)
    }
    takeRecords() {
      return []
    }
  }

  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

  /** sentinel이 붙을 때까지 기다렸다가 화면에 들어왔다고 알린다 */
  return async function scrollToEnd() {
    await waitFor(() => {
      expect(live.size).toBeGreaterThan(0)
    })
    const entry = [{ isIntersecting: true }] as unknown as IntersectionObserverEntry[]
    const observer = {} as IntersectionObserver
    await act(async () => {
      live.forEach((callback) => {
        callback(entry, observer)
      })
      // 이어받기 요청이 렌더까지 가도록 마이크로태스크를 한 번 넘긴다
      await Promise.resolve()
    })
  }
}

function renderView(options?: StubOptions) {
  const { requests, resumeHeldList } = stubApi(options)
  const scrollToEnd = stubIntersectionObserver()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <SpoilerPassagesView />
    </QueryClientProvider>,
  )
  return { requests, scrollToEnd, resumeHeldList }
}

/** 대목 목록 요청만 골라 본다 — 도서 필터 요청이 섞여 들어온다 */
function passageListUrls(requests: { url: string; method: string }[]) {
  return requests.filter((request) => request.url.includes('/me/passages')).map(({ url }) => url)
}

describe('스포일러 관리', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('셸(제목·도서 필터)은 목록을 기다리지 않고 먼저 선다', () => {
    renderView()

    expect(screen.getByRole('heading', { name: '스포일러 관리' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '도서 필터' })).toBeInTheDocument()
  })

  it('스포일러가 하나도 없으면 빈 상태 문구를 보여준다', async () => {
    renderView({ pages: [page([])] })

    expect(await screen.findByText('등록한 스포일러가 없습니다')).toBeInTheDocument()
  })

  it('내 대목 중 스포일러만 달라고 요청한다', async () => {
    const { requests } = renderView()
    await screen.findByText(PASSAGE.quotedText)

    expect(passageListUrls(requests)[0]).toContain('spoilerOnly=true')
  })

  it('카드는 쪽수와 작성일을 머리줄에, 대목 인용문을 본문에 보여준다', async () => {
    renderView()

    expect(await screen.findByText(PASSAGE.quotedText)).toBeInTheDocument()
    expect(screen.getByText('128p')).toBeInTheDocument()
    expect(screen.getByText('26.08.10')).toBeInTheDocument()
  })

  it('도서 필터에서 책을 고르면 그 bookId로 목록을 다시 불러온다', async () => {
    const { requests } = renderView()
    await screen.findByText(PASSAGE.quotedText)

    // base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다 — userEvent로 조작해야 한다
    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    await waitFor(() => {
      expect(passageListUrls(requests).some((url) => url.includes('bookId=5'))).toBe(true)
    })
  })

  it('도서 필터를 바꿔도 직전 목록이 남아 스켈레톤으로 번쩍이지 않는다', async () => {
    const { resumeHeldList } = renderView({
      pages: [page([PASSAGE, BOOK_5_PASSAGE])],
      holdFilteredList: true,
    })
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    // 걸러낸 목록이 아직 오지 않았는데도 직전 카드가 그대로 서 있다
    expect(screen.getByText(PASSAGE.quotedText)).toBeInTheDocument()

    await resumeHeldList()
    expect(await screen.findByText(BOOK_5_PASSAGE.quotedText)).toBeInTheDocument()
  })

  it('도서 필터 옵션은 서버가 준 순서 그대로 전부 나온다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))

    const options = await screen.findAllByRole('option')
    // 고른 값('전체 책 보기')은 목록에서 빠지고 나머지가 서버 순서대로 남는다
    expect(options.map((option) => option.textContent)).toEqual(['모순', '만조를 기다리며'])
  })

  it('해제를 누르면 확인 다이얼로그가 뜬다', async () => {
    renderView()
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))

    expect(await screen.findByRole('dialog')).toHaveTextContent('해당 문장의 스포일러를')
  })

  it('확정하면 해제 요청이 나가고 카드가 목록에서 빠진다', async () => {
    const { requests } = renderView()
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))
    await userEvent.click(await screen.findByRole('button', { name: '스포일러 해제' }))

    await waitFor(() => {
      expect(screen.queryByText(PASSAGE.quotedText)).not.toBeInTheDocument()
    })

    const released = requests.filter((request) => request.url.includes('/spoiler'))
    expect(released).toHaveLength(1)
    expect(released[0]?.method).toBe('PATCH')
    expect(released[0]?.url).toContain('/api/passages/91/spoiler')
    expect(JSON.parse(released[0]?.body ?? '{}')).toEqual({ isSpoiler: false })
  })

  it('해제에 실패하면 다시 시도하라고 알린다', async () => {
    renderView({ releaseStatus: 500 })
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))
    await userEvent.click(await screen.findByRole('button', { name: '스포일러 해제' }))

    expect(await screen.findByText(/스포일러를 해제하지 못했어요/)).toBeInTheDocument()
    // 실패해도 카드는 그대로 남아 다시 시도할 수 있다
    expect(screen.getByText(PASSAGE.quotedText)).toBeInTheDocument()
  })

  it('해제한 책이 마지막 스포일러였을 수 있어 도서 필터도 다시 받는다', async () => {
    const { requests } = renderView()
    await screen.findByText(PASSAGE.quotedText)
    const before = requests.filter((request) => request.url.includes('/filter-books')).length

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))
    await userEvent.click(await screen.findByRole('button', { name: '스포일러 해제' }))

    await waitFor(() => {
      expect(
        requests.filter((request) => request.url.includes('/filter-books')).length,
      ).toBeGreaterThan(before)
    })
  })

  it('실패 안내는 다음 대목의 해제를 시작하면 걷힌다', async () => {
    const other = { ...PASSAGE, passageId: 92, pageNumber: 200, quotedText: '다른 대목입니다.' }
    renderView({ pages: [page([PASSAGE, other])], releaseStatus: 500 })
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))
    await userEvent.click(await screen.findByRole('button', { name: '스포일러 해제' }))
    await screen.findByText(/스포일러를 해제하지 못했어요/)

    await userEvent.click(screen.getByRole('button', { name: '200쪽 스포일러 해제' }))

    await waitFor(() => {
      expect(screen.queryByText(/스포일러를 해제하지 못했어요/)).not.toBeInTheDocument()
    })
  })

  it('카드를 누르면 그 흔적으로 간다', async () => {
    renderView()
    await screen.findByText(PASSAGE.quotedText)

    const link = screen.getByRole('link', { name: '128쪽 흔적 보기' })
    expect(link).toHaveAttribute('href', expect.stringContaining('opinionId=404'))
  })

  it('도서 필터는 서버 기본값 20에 잘리지 않게 한 번에 받는다', async () => {
    const { requests } = renderView()
    await screen.findByText(PASSAGE.quotedText)

    const filterRequest = requests.find((request) => request.url.includes('/filter-books'))
    expect(filterRequest?.url).toContain('size=100')
  })

  it('뒤로를 누르면 다이얼로그가 닫힌다', async () => {
    renderView()
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: '뒤로' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('목록 끝이 보이면 다음 페이지를 이어 받는다', async () => {
    const { requests, scrollToEnd } = renderView({
      pages: [page([PASSAGE], true), page([NEXT_PAGE_PASSAGE])],
    })
    await screen.findByText(PASSAGE.quotedText)

    await scrollToEnd()

    expect(await screen.findByText(NEXT_PAGE_PASSAGE.quotedText)).toBeInTheDocument()
    expect(passageListUrls(requests).some((url) => url.includes('page=1'))).toBe(true)
  })

  it('다음 페이지를 못 받으면 목록 끝에 다시 시도할 자리를 남긴다', async () => {
    const { scrollToEnd } = renderView({
      pages: [page([PASSAGE], true), page([NEXT_PAGE_PASSAGE])],
      failNextPageTimes: 1,
    })
    await screen.findByText(PASSAGE.quotedText)

    await scrollToEnd()

    // 스피너도 오류도 없이 목록이 멈추면 안 된다
    expect(await screen.findByText('더 불러오지 못했어요.')).toBeInTheDocument()
    // 이미 받은 목록은 그대로 남는다
    expect(screen.getByText(PASSAGE.quotedText)).toBeInTheDocument()
  })

  it('다시 불러오기를 누르면 끊긴 다음 페이지를 이어 받는다', async () => {
    const { scrollToEnd } = renderView({
      pages: [page([PASSAGE], true), page([NEXT_PAGE_PASSAGE])],
      failNextPageTimes: 1,
    })
    await screen.findByText(PASSAGE.quotedText)
    await scrollToEnd()
    await screen.findByText('더 불러오지 못했어요.')

    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText(NEXT_PAGE_PASSAGE.quotedText)).toBeInTheDocument()
  })

  it('첫 페이지가 통째로 비어도 다음 페이지가 있으면 이어 받는다', async () => {
    const { requests, scrollToEnd } = renderView({
      pages: [page([], true), page([PASSAGE])],
    })

    // 빈 상태로 끝내면 sentinel이 서지 않아 다음 페이지를 영영 못 부른다
    await scrollToEnd()

    expect(await screen.findByText(PASSAGE.quotedText)).toBeInTheDocument()
    expect(passageListUrls(requests).some((url) => url.includes('page=1'))).toBe(true)
    expect(screen.queryByText('등록한 스포일러가 없습니다')).not.toBeInTheDocument()
  })

  it('고른 책이 도서 필터에서 빠지면 전체로 되돌아간다', async () => {
    const { requests } = renderView({
      pages: [page([PASSAGE, BOOK_5_PASSAGE])],
      // 5번 책의 마지막 스포일러를 풀면 서버가 그 책을 필터에서 뺀다
      booksAfterRelease: [{ bookId: 3, title: '모순' }],
    })
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))
    await screen.findByText(BOOK_5_PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '300쪽 스포일러 해제' }))
    await userEvent.click(await screen.findByRole('button', { name: '스포일러 해제' }))

    // 트리거에 라벨 대신 bookId('5')가 그대로 뜨면 안 된다
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: '도서 필터' })).toHaveTextContent('전체 책 보기')
    })
    // 목록도 사라진 책으로 걸린 채 남지 않는다
    expect(await screen.findByText(PASSAGE.quotedText)).toBeInTheDocument()
    await waitFor(() => {
      expect(passageListUrls(requests).at(-1)).not.toContain('bookId=')
    })
  })
})
