import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { userQueries } from '@/app/_global/_queries/user.queries'

import { LikedOpinionsView } from '../_components/LikedOpinionsView/LikedOpinionsView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const OPINION = {
  opinionId: 11,
  bookId: 3,
  bookTitle: '모순',
  author: '양귀자',
  bookCoverImageUrl: null,
  passageId: 91,
  quotedText: '책장 냄새가 이렇게',
  pageNumber: 128,
  content: '두꺼운 책을 멀리한지 꽤 되어서 걱정됬는데, 걱정이 무색할 정도로 술술 읽혔습니다.',
  nickname: '밤샘낭독가',
  likeCount: 4,
  createdAt: '2026-08-01T00:00:00Z',
  likedAt: '2026-08-02T00:00:00Z',
}

/** 두 번째 페이지에만 실려 오는 흔적 — 무한 스크롤이 실제로 이어졌는지 이걸로 본다 */
const NEXT_PAGE_OPINION = {
  ...OPINION,
  opinionId: 12,
  content: '두 번째 페이지에서 온 흔적입니다.',
  nickname: '느린독서',
}

const BOOKS = [
  { bookId: 3, title: '모순' },
  { bookId: 5, title: '만조를 기다리며' },
]

/** 하트 버튼 이름은 행마다 다르다 — 어느 카드의 하트인지 이름만으로 갈라야 한다 */
const HEART_LABEL = `${OPINION.nickname}님의 흔적 좋아요`

/** Snackbar의 자동 닫힘 시간(AUTO_DISMISS_MS)과 같은 값 */
const SNACKBAR_DISMISS_MS = 3000

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

/** 붙잡아 둔 응답을 푸는 함수들 — 도착 전 화면을 보려면 응답을 멈춰 세워야 한다 */
const heldResponses: (() => void)[] = []

async function releaseHeldResponses() {
  await act(async () => {
    heldResponses.splice(0).forEach((release) => {
      release()
    })
    await Promise.resolve()
  })
}

type StubOptions = {
  /** 첫 페이지의 목록 */
  opinions?: (typeof OPINION)[]
  /** bookId가 붙은 목록 요청의 응답을 releaseHeldResponses를 부를 때까지 붙잡아 둔다 */
  holdFilteredList?: boolean
  /** 주면 첫 페이지가 hasNext로 오고, page=1 요청에 이 목록을 돌려준다 */
  nextPageOpinions?: (typeof OPINION)[]
  /** page=1 요청을 처음 한 번만 500으로 떨군다 */
  failNextPageOnce?: boolean
  /** 도서 필터 응답을 호출 순서대로 돌려준다. 마지막 것을 계속 쓴다 */
  bookResponses?: (typeof BOOKS)[]
}

/** 오간 요청 url을 순서대로 담는다 — 필터·토글이 실제로 서버까지 갔는지 여기서 본다 */
function stubApi({
  opinions = [OPINION],
  holdFilteredList = false,
  nextPageOpinions,
  failNextPageOnce = false,
  bookResponses = [BOOKS],
}: StubOptions = {}) {
  const requests: { url: string; method: string }[] = []
  // 서버처럼 토글이 상태를 뒤집어야 되돌리기까지 이어서 볼 수 있다
  let liked = true
  let remainingNextPageFailures = failNextPageOnce ? 1 : 0
  let bookCall = 0

  const listPage = (items: (typeof OPINION)[], page: number, hasNext: boolean) =>
    new Response(
      JSON.stringify({
        data: {
          opinions: items,
          pageInfo: {
            page,
            size: 20,
            totalElements: items.length,
            totalPages: hasNext ? 2 : 1,
            hasNext,
          },
        },
      }),
    )

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method ?? 'GET' })

      if (url.includes('/api/opinions/') && url.endsWith('/like')) {
        liked = !liked
        return Promise.resolve(
          new Response(
            JSON.stringify({ data: { liked, likeCount: liked ? OPINION.likeCount : 3 } }),
          ),
        )
      }
      if (url.includes('/filter-books')) {
        const books = bookResponses[Math.min(bookCall, bookResponses.length - 1)] ?? BOOKS
        bookCall += 1
        return Promise.resolve(new Response(JSON.stringify({ data: { books } })))
      }
      if (holdFilteredList && url.includes('bookId=')) {
        return new Promise<Response>((resolve) => {
          heldResponses.push(() => {
            resolve(listPage(opinions, 0, false))
          })
        })
      }
      if (url.includes('page=1')) {
        if (remainingNextPageFailures > 0) {
          remainingNextPageFailures -= 1
          return Promise.resolve(new Response('{}', { status: 500 }))
        }
        return Promise.resolve(listPage(nextPageOpinions ?? [], 1, false))
      }
      return Promise.resolve(listPage(opinions, 0, nextPageOpinions !== undefined))
    }),
  )

  return requests
}

/** 무효화 결과를 캐시에서 직접 봐야 하는 테스트를 위해 client와 unmount를 함께 돌려준다 */
function renderViewWithCache(options?: StubOptions) {
  const requests = stubApi(options)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <LikedOpinionsView />
    </QueryClientProvider>,
  )
  return { requests, client, unmount }
}

function renderView(options?: StubOptions) {
  return renderViewWithCache(options).requests
}

/** 좋아요 목록 요청만 골라 본다 — 도서 필터 요청과 토글 요청이 섞여 들어온다 */
function likedListUrls(requests: { url: string; method: string }[]) {
  return requests.filter((request) => request.url.includes('/me/likes')).map(({ url }) => url)
}

/**
 * 스낵바가 자동으로 닫힐 때까지 흘려보낸다. 3초를 실제로 기다리지 않으려고 이 구간만
 * 가짜 타이머로 바꾼다 — 앞선 조작(base-ui Select 등)은 실제 타이머 위에서 해야 한다.
 */
async function waitForSnackbarToClose() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SNACKBAR_DISMISS_MS)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

describe('좋아요 관리', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    mountedObservers.clear()
    heldResponses.length = 0
  })

  it('셸(제목·도서 필터)은 목록을 기다리지 않고 먼저 선다', () => {
    renderView()

    expect(screen.getByRole('heading', { name: '좋아요 관리' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '도서 필터' })).toBeInTheDocument()
  })

  it('좋아요가 하나도 없으면 빈 상태 문구를 보여준다', async () => {
    renderView({ opinions: [] })

    expect(await screen.findByText('등록한 좋아요가 없습니다')).toBeInTheDocument()
  })

  it('도서 필터에서 책을 고르면 그 bookId로 목록을 다시 불러온다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    // base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다 — userEvent로 조작해야 한다
    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    await waitFor(() => {
      expect(likedListUrls(requests).some((url) => url.includes('bookId=5'))).toBe(true)
    })
  })

  it('도서 필터 옵션은 서버가 준 순서 그대로 전부 나온다', async () => {
    renderView()

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))

    const options = await screen.findAllByRole('option')
    // 고른 값('전체 책 보기')은 목록에서 빠지고 나머지가 서버 순서대로 남는다
    expect(options.map((option) => option.textContent)).toEqual(['모순', '만조를 기다리며'])
  })

  it('책을 바꾸는 동안 이전 목록을 유지한다 — 전환마다 골격이 번쩍이지 않는다', async () => {
    const requests = renderView({ holdFilteredList: true })
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    // 새 책의 목록이 도착하기 전에도 이전 목록이 자리를 지켜야 한다
    await waitFor(() => {
      expect(likedListUrls(requests).some((url) => url.includes('bookId=5'))).toBe(true)
    })
    expect(screen.getByText(OPINION.content)).toBeInTheDocument()

    await releaseHeldResponses()
  })

  it('하트를 끄면 좋아요 해제를 요청하고 되돌릴 수 있는 스낵바를 띄운다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    const heart = screen.getByRole('button', { name: HEART_LABEL })
    expect(heart).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(heart)

    expect(await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: HEART_LABEL })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(1)
  })

  it('스낵바의 취소를 누르면 좋아요를 다시 켜고 안내가 닫힌다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: HEART_LABEL })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(2)
  })

  it('하트를 직접 다시 켜면 되돌릴 것이 없어 안내가 걷힌다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))

    // 안내가 남아 있으면 '취소'가 한 번 더 토글해 좋아요를 도로 꺼버린다
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: HEART_LABEL })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(2)
  })

  it('해제한 카드는 목록에 그대로 남는다 — 되돌릴 자리가 사라지면 안 된다', async () => {
    renderView()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    expect(screen.getByText(OPINION.content)).toBeInTheDocument()
  })

  it('되돌리기 창이 끝나면 목록과 도서 필터를 다시 받는다', async () => {
    const requests = renderView()
    await screen.findByText(OPINION.content)

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    expect(screen.getByText('밤샘낭독가님의 좋아요를 해제했어요')).toBeInTheDocument()

    const before = requests.length
    await waitForSnackbarToClose()
    vi.useRealTimers()

    // 되돌릴 수 없게 된 뒤에도 캐시가 그대로면, 60초 안에 다시 들어왔을 때 해제한 카드가 남는다
    await waitFor(() => {
      const after = requests.slice(before)
      expect(after.some((request) => request.url.includes('/me/likes'))).toBe(true)
      expect(after.some((request) => request.url.includes('/filter-books'))).toBe(true)
    })
  })

  it('되돌릴 창이 열린 채 화면을 벗어나도 해제를 확정한다', async () => {
    const { client, unmount } = renderViewWithCache()
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')

    unmount()

    // 화면이 없으니 곧바로 다시 부르진 않는다 — 다음 진입이 새로 받도록 stale로 찍혀야 한다
    expect(client.getQueryState(userQueries.likedOpinionList().queryKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(userQueries.filterBooks('LIKE').queryKey)?.isInvalidated).toBe(true)
  })

  it('되돌리기 전에 다른 카드를 해제하면 앞선 해제부터 확정한다', async () => {
    const requests = renderView({ opinions: [OPINION, NEXT_PAGE_OPINION] })
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')
    const before = requests.length

    await userEvent.click(
      screen.getByRole('button', { name: `${NEXT_PAGE_OPINION.nickname}님의 흔적 좋아요` }),
    )
    await screen.findByText('느린독서님의 좋아요를 해제했어요')

    // 되돌릴 자리는 하나뿐이라 앞선 해제는 여기서 확정된다
    await waitFor(() => {
      const after = requests.slice(before)
      expect(after.some((request) => request.url.includes('/me/likes'))).toBe(true)
      expect(after.some((request) => request.url.includes('/filter-books'))).toBe(true)
    })
  })

  it('고른 책이 도서 필터에서 사라지면 전체 보기로 되돌린다', async () => {
    // 그 책의 마지막 좋아요를 해제하면 두 번째 응답부터 책이 빠진다
    const requests = renderView({ bookResponses: [BOOKS, BOOKS.slice(0, 1)] })
    await screen.findByText(OPINION.content)

    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: '도서 필터' })).toHaveTextContent(
        '만조를 기다리며',
      )
    })

    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: HEART_LABEL }))
    const before = requests.length
    await waitForSnackbarToClose()
    vi.useRealTimers()

    // 값만 남으면 트리거에 제목 대신 bookId('5')가 그려지고 목록도 그 책에 묶인 채 빈다
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: '도서 필터' })).toHaveTextContent('전체 책 보기')
    })
    await waitFor(() => {
      expect(likedListUrls(requests.slice(before)).some((url) => !url.includes('bookId='))).toBe(
        true,
      )
    })
  })

  it('다음 페이지를 못 불러오면 재시도 줄을 세우고, 누르면 이어서 불러온다', async () => {
    renderView({ nextPageOpinions: [NEXT_PAGE_OPINION], failNextPageOnce: true })
    await screen.findByText(OPINION.content)

    await scrollToListEnd()

    // 스피너도 오류도 없이 멈추면 사용자는 '여기까지가 전부'로 읽는다
    expect(await screen.findByText('더 불러오지 못했어요.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText(NEXT_PAGE_OPINION.content)).toBeInTheDocument()
    expect(screen.queryByText('더 불러오지 못했어요.')).not.toBeInTheDocument()
  })

  it('첫 페이지가 통째로 비어도 다음 페이지가 있으면 이어서 불러온다', async () => {
    renderView({ opinions: [], nextPageOpinions: [NEXT_PAGE_OPINION] })
    // 빈 상태 문구가 sentinel보다 먼저 return하면 관찰자가 아예 붙지 않는다
    await waitFor(() => {
      expect(mountedObservers.size).toBeGreaterThan(0)
    })

    // 아직 올 페이지가 있으니 빈 문구를 먼저 띄우면 안 된다
    expect(screen.queryByText('등록한 좋아요가 없습니다')).not.toBeInTheDocument()

    await scrollToListEnd()

    expect(await screen.findByText(NEXT_PAGE_OPINION.content)).toBeInTheDocument()
  })

  it('카드를 누르면 그 흔적이 열린 흔적 보기로 간다 — 시안에 어피던스는 없지만 경로는 남는다', async () => {
    renderView()
    await screen.findByText(OPINION.content)

    expect(screen.getByRole('link', { name: '밤샘낭독가님의 흔적 보기' })).toHaveAttribute(
      'href',
      '/trace/3?page=128&passageId=91&opinionId=11',
    )
  })
})
