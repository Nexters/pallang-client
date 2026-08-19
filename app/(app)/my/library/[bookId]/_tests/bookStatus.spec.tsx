import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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

const PAGE_INFO = { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false }

type Request = { url: string; method: string; body?: string }

/**
 * 책 상세만 상태를 들고 온다. 저장이 성공하면 서버처럼 그 값을 물고 있어야
 * 무효화 뒤 다시 물어본 응답에서 뱃지가 바뀌는 걸 볼 수 있다.
 */
function stubApi(initialStatus: string | null) {
  const requests: Request[] = []
  let myStatus = initialStatus

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      const body = typeof options?.body === 'string' ? options.body : undefined
      requests.push({ url, method: options?.method ?? 'GET', body })

      if (url.includes('/me/book-status')) {
        myStatus = (JSON.parse(body ?? '{}') as { status: string }).status
        return Promise.resolve(
          new Response(JSON.stringify({ data: { bookId: BOOK_ID, myStatus } })),
        )
      }
      if (url.includes('/me/')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ data: { opinions: [], passages: [], pageInfo: PAGE_INFO } }),
          ),
        )
      }
      return Promise.resolve(new Response(JSON.stringify({ data: { ...BOOK, myStatus } })))
    }),
  )

  return requests
}

function renderView(initialStatus: string | null = null) {
  const requests = stubApi(initialStatus)
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

describe('책 상세 독서 상태', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('상태가 없으면 뱃지 대신 시트로 가는 자리만 남는다', async () => {
    renderView(null)

    expect(await screen.findByRole('button', { name: '독서 상태' })).toBeInTheDocument()
    expect(screen.queryByText('읽고 있는 책')).not.toBeInTheDocument()
  })

  it('READING이면 책 머리에 읽고 있는 책 뱃지가 뜬다', async () => {
    renderView('READING')

    expect(await screen.findByRole('button', { name: '읽고 있는 책' })).toBeInTheDocument()
  })

  it('시안에 없는 PLANNED는 뱃지로 그리지 않는다', async () => {
    renderView('PLANNED')

    expect(await screen.findByRole('button', { name: '독서 상태' })).toBeInTheDocument()
  })

  it('시트는 현재 상태를 고른 채 열린다', async () => {
    renderView('READING')

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))

    expect(await screen.findByRole('radio', { name: '읽고 있는 책' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('상태가 없으면 아무것도 고르지 않은 채 열리고 저장이 막혀 있다', async () => {
    renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))

    expect(await screen.findByRole('radio', { name: '읽고 있는 책' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('완독은 시안대로 그리되 고를 수 없다', async () => {
    const requests = renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))

    const finished = await screen.findByRole('radio', { name: '완독' })
    expect(finished).toBeDisabled()

    const before = requests.length
    await userEvent.click(finished)

    expect(requests).toHaveLength(before)
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('읽고 있는 책을 저장하면 PUT이 나가고 뱃지가 갱신된다', async () => {
    const requests = renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))
    await userEvent.click(await screen.findByRole('radio', { name: '읽고 있는 책' }))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('button', { name: '읽고 있는 책' })).toBeInTheDocument()

    const saved = requests.filter((request) => request.url.includes('/me/book-status'))
    expect(saved).toHaveLength(1)
    expect(saved[0]?.method).toBe('PUT')
    expect(JSON.parse(saved[0]?.body ?? '{}')).toMatchObject({ bookId: BOOK_ID, status: 'READING' })
  })
})
