import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BookDetailView } from '../_components/BookDetailView/BookDetailView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const BOOK_ID = 12

const BOOK = {
  bookId: BOOK_ID,
  title: '모순',
  author: '양귀자',
  publisher: '쓰다',
  pageCount: 300,
  coverImageUrl: null,
  passageCount: 6,
  opinionCount: 17,
}

/** 세 줄을 넘겨 `더보기`가 뜨게 만드는 길이 */
const LONG_CONTENT = Array.from(
  { length: 4 },
  () => '두꺼운 책을 멀리한지 꽤 되어서 걱정됬는데, 걱정이 무색할 정도로 술술 읽혔습니다.',
).join(' ')

const MY_OPINION = {
  opinionId: 11,
  bookId: BOOK_ID,
  bookTitle: '모순',
  author: '양귀자',
  bookCoverImageUrl: null,
  passageId: 91,
  quotedText: '책장 냄새가 이렇게',
  pageNumber: 128,
  content: LONG_CONTENT,
  likeCount: 4,
  createdAt: '2026-08-10T00:00:00Z',
}

const LIKED_OPINION = {
  ...MY_OPINION,
  opinionId: 21,
  content: '남이 남긴 흔적입니다.',
  nickname: '밤샘낭독가',
  likedAt: '2026-08-02T00:00:00Z',
}

const SPOILER_PASSAGE = {
  passageId: 91,
  bookId: BOOK_ID,
  pageNumber: 128,
  quotedText: '진진이는 그 문장을 끝내 소리 내어 읽지 못했다.',
  isSpoiler: true,
  createdAt: '2026-08-10T00:00:00Z',
}

const PAGE_INFO = { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false }

type Records = {
  opinions?: (typeof MY_OPINION)[]
  liked?: (typeof LIKED_OPINION)[]
  passages?: (typeof SPOILER_PASSAGE)[]
}

/** 본문 한 줄에 들어가는 글자 수와 줄 높이 — 실제 값이 아니라 넘침을 만들기 위한 눈금이다 */
const CHARS_PER_LINE = 30
const LINE_HEIGHT = 24
/** 접힌 본문은 세 줄까지만 보인다 */
const CLAMPED_HEIGHT = LINE_HEIGHT * 3

/**
 * happy-dom에는 레이아웃 엔진이 없어 `scrollHeight`/`clientHeight`가 언제나 0이고
 * `ResizeObserver`도 콜백을 부르지 않는다 — 그대로 두면 넘침 판정이 아예 일어나지 않는다.
 * 글자 수로 높이를 흉내 내고, observe() 시점에 콜백을 한 번 불러 브라우저의 최초 통지를 대신한다.
 */
function stubLayout() {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return Math.ceil(this.textContent.length / CHARS_PER_LINE) * LINE_HEIGHT
  })
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    // 펼친 뒤에는 line-clamp가 풀려 잘리는 높이가 사라진다
    return this.className.includes('line-clamp-3') ? CLAMPED_HEIGHT : this.scrollHeight
  })

  vi.stubGlobal(
    'ResizeObserver',
    class {
      unobserve = vi.fn()
      disconnect = vi.fn()
      constructor(private readonly callback: () => void) {}
      /** observe()가 최초 한 번을 바로 물어다 주는 브라우저 동작을 흉내 낸다 */
      observe() {
        this.callback()
      }
    },
  )
}

/** 오간 요청을 순서대로 담는다 — 탭마다 어디로 물어보는지, 확정이 막혀 있는지 여기서 본다 */
function stubApi({ opinions = [], liked = [], passages = [] }: Records) {
  const requests: { url: string; method: string }[] = []
  // 서버처럼 토글이 상태를 뒤집어야 되돌리기까지 이어서 볼 수 있다
  let isLiked = true

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method ?? 'GET' })

      if (url.includes('/me/opinions')) return listResponse({ opinions })
      if (url.includes('/me/likes')) return listResponse({ opinions: liked })
      if (url.includes('/me/passages')) return listResponse({ passages })
      if (url.includes('/api/opinions/') && url.endsWith('/like')) {
        isLiked = !isLiked
        return Promise.resolve(
          new Response(JSON.stringify({ data: { liked: isLiked, likeCount: isLiked ? 4 : 3 } })),
        )
      }
      return Promise.resolve(new Response(JSON.stringify({ data: BOOK })))
    }),
  )

  return requests
}

function listResponse(payload: Record<string, unknown>) {
  return Promise.resolve(
    new Response(JSON.stringify({ data: { ...payload, pageInfo: PAGE_INFO } })),
  )
}

function renderView(records: Records = {}) {
  stubLayout()
  const requests = stubApi(records)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <BookDetailView bookId={BOOK_ID} />
    </QueryClientProvider>,
  )
  return requests
}

function urlsFor(requests: { url: string }[], fragment: string) {
  return requests.filter((request) => request.url.includes(fragment)).map(({ url }) => url)
}

describe('내 서재 책 상세', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('책 머리에 제목·출판사·지은이와 대목·흔적 수를 보여준다', async () => {
    renderView({ opinions: [MY_OPINION] })

    expect(await screen.findByText('모순')).toBeInTheDocument()
    expect(screen.getByText('쓰다 · 양귀자')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('셸(제목·탭)은 목록을 기다리지 않고 먼저 선다', () => {
    renderView({ opinions: [MY_OPINION] })

    expect(screen.getByRole('heading', { name: '내 서재' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '의견' })).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('처음에는 이 책으로 좁힌 내 흔적만 요청한다', async () => {
    const requests = renderView({ opinions: [MY_OPINION] })

    await screen.findByText(LONG_CONTENT)
    expect(urlsFor(requests, '/me/opinions')[0]).toContain(`bookId=${String(BOOK_ID)}`)
    expect(urlsFor(requests, '/me/likes')).toHaveLength(0)
    expect(urlsFor(requests, '/me/passages')).toHaveLength(0)
  })

  it('좋아요 탭으로 옮기면 이 책의 좋아요 목록을 요청한다', async () => {
    const requests = renderView({ opinions: [MY_OPINION], liked: [LIKED_OPINION] })
    await screen.findByText(LONG_CONTENT)

    await userEvent.click(screen.getByRole('tab', { name: '좋아요' }))

    expect(await screen.findByText('밤샘낭독가')).toBeInTheDocument()
    expect(urlsFor(requests, '/me/likes')[0]).toContain(`bookId=${String(BOOK_ID)}`)
  })

  it('스포일러 탭으로 옮기면 이 책의 스포일러 대목만 요청한다', async () => {
    const requests = renderView({ opinions: [MY_OPINION], passages: [SPOILER_PASSAGE] })
    await screen.findByText(LONG_CONTENT)

    await userEvent.click(screen.getByRole('tab', { name: '스포일러' }))

    expect(await screen.findByText(SPOILER_PASSAGE.quotedText)).toBeInTheDocument()
    const passageUrl = urlsFor(requests, '/me/passages')[0]
    expect(passageUrl).toContain(`bookId=${String(BOOK_ID)}`)
    expect(passageUrl).toContain('spoilerOnly=true')
  })

  it('탭마다 비어 있으면 그 탭의 빈 상태 문구를 보여준다', async () => {
    renderView()

    expect(await screen.findByText('등록한 의견이 없습니다')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: '좋아요' }))
    expect(await screen.findByText('등록한 좋아요가 없습니다')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: '스포일러' }))
    expect(await screen.findByText('등록한 스포일러가 없습니다')).toBeInTheDocument()
  })

  it('의견 카드는 머리줄 오른쪽에 작성일을 세운다', async () => {
    renderView({ opinions: [MY_OPINION] })

    expect(await screen.findByText('128p')).toBeInTheDocument()
    expect(screen.getByText('26.08.10')).toBeInTheDocument()
  })

  it('의견 카드는 더보기로 펼친 뒤 접기로 되돌아온다', async () => {
    renderView({ opinions: [MY_OPINION] })

    await userEvent.click(await screen.findByRole('button', { name: '더보기' }))
    expect(screen.getByText(LONG_CONTENT)).not.toHaveClass('line-clamp-3')

    await userEvent.click(screen.getByRole('button', { name: '접기' }))

    expect(screen.getByText(LONG_CONTENT)).toHaveClass('line-clamp-3')
    // 다시 잰 뒤에도 어피던스가 남아야 또 펼칠 수 있다
    expect(screen.getByRole('button', { name: '더보기' })).toBeInTheDocument()
  })

  it('편집 버튼은 자리만 잡고 막혀 있다', async () => {
    renderView({ opinions: [MY_OPINION] })

    expect(await screen.findByRole('button', { name: '편집' })).toBeDisabled()
  })

  it('스포일러 해제 확정은 막혀 있고 눌러도 서버로 아무것도 보내지 않는다', async () => {
    const requests = renderView({ passages: [SPOILER_PASSAGE] })
    await userEvent.click(await screen.findByRole('tab', { name: '스포일러' }))
    await userEvent.click(await screen.findByRole('button', { name: '128쪽 스포일러 해제' }))

    const confirm = await screen.findByRole('button', { name: '스포일러 해제' })
    expect(confirm).toBeDisabled()

    const before = requests.length
    await userEvent.click(confirm)

    expect(requests).toHaveLength(before)
    expect(requests.every((request) => request.method === 'GET')).toBe(true)
  })

  it('좋아요를 해제하면 되돌릴 수 있는 안내가 뜨고, 탭을 옮기면 함께 닫힌다', async () => {
    renderView({ liked: [LIKED_OPINION] })
    await userEvent.click(await screen.findByRole('tab', { name: '좋아요' }))

    await userEvent.click(await screen.findByRole('button', { name: '좋아요' }))

    expect(await screen.findByText('밤샘낭독가님의 좋아요를 해제했어요')).toBeInTheDocument()

    // 옮긴 탭에는 되돌릴 카드가 없다 — 안내도 함께 걷힌다
    await userEvent.click(screen.getByRole('tab', { name: '의견' }))

    await waitFor(() => {
      expect(screen.queryByText('밤샘낭독가님의 좋아요를 해제했어요')).not.toBeInTheDocument()
    })
  })
})
