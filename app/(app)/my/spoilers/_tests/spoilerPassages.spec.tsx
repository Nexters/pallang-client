import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SpoilerPassagesView } from '../_components/SpoilerPassagesView/SpoilerPassagesView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const PASSAGE = {
  passageId: 91,
  bookId: 3,
  pageNumber: 128,
  quotedText: '진진이는 그 문장을 끝내 소리 내어 읽지 못했다.',
  isSpoiler: true,
  createdAt: '2026-08-10T00:00:00Z',
}

const BOOKS = [
  { bookId: 3, title: '모순' },
  { bookId: 5, title: '만조를 기다리며' },
]

/** 오간 요청을 순서대로 담는다 — 필터가 서버까지 갔는지, 해제가 아무것도 안 보냈는지 여기서 본다 */
function stubApi(passages: (typeof PASSAGE)[] = [PASSAGE]) {
  const requests: { url: string; method: string }[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      requests.push({ url, method: options?.method ?? 'GET' })

      if (url.includes('/filter-books')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { books: BOOKS } })))
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              passages,
              pageInfo: {
                page: 0,
                size: 20,
                totalElements: passages.length,
                totalPages: 1,
                hasNext: false,
              },
            },
          }),
        ),
      )
    }),
  )

  return requests
}

function renderView(passages?: (typeof PASSAGE)[]) {
  const requests = stubApi(passages)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <SpoilerPassagesView />
    </QueryClientProvider>,
  )
  return requests
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
    renderView([])

    expect(await screen.findByText('등록한 스포일러가 없습니다')).toBeInTheDocument()
  })

  it('내 대목 중 스포일러만 달라고 요청한다', async () => {
    const requests = renderView()
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
    const requests = renderView()
    await screen.findByText(PASSAGE.quotedText)

    // base-ui의 Select.Item은 하이라이트된 항목만 클릭으로 커밋한다 — userEvent로 조작해야 한다
    await userEvent.click(screen.getByRole('combobox', { name: '도서 필터' }))
    await screen.findByRole('listbox')
    await userEvent.click(screen.getByRole('option', { name: '만조를 기다리며' }))

    await waitFor(() => {
      expect(passageListUrls(requests).some((url) => url.includes('bookId=5'))).toBe(true)
    })
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

  it('확정 버튼은 막혀 있고 눌러도 서버로 아무것도 보내지 않는다', async () => {
    const requests = renderView()
    await screen.findByText(PASSAGE.quotedText)

    await userEvent.click(screen.getByRole('button', { name: '128쪽 스포일러 해제' }))

    const confirm = await screen.findByRole('button', { name: '스포일러 해제' })
    expect(confirm).toBeDisabled()

    const before = requests.length
    await userEvent.click(confirm)

    expect(requests).toHaveLength(before)
    expect(requests.every((request) => request.method === 'GET')).toBe(true)
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
})
