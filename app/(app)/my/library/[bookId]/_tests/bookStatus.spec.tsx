import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
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
  // PUT은 상태와 현재 페이지를 함께 덮어쓴다 — 이 값이 그대로 되돌아 나가는지 잠근다
  myCurrentPage: 128,
}

const PAGE_INFO = { page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false }

type Request = { url: string; method: string; body?: string }

/**
 * 책 상세만 상태를 들고 온다. 저장이 성공하면 서버처럼 그 값을 물고 있어야
 * 무효화 뒤 다시 물어본 응답에서 뱃지가 바뀌는 걸 볼 수 있다.
 */
function stubApi(initialStatus: string | null, saveStatusCode = 200) {
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
        if (saveStatusCode !== 200) {
          return Promise.resolve(new Response('{}', { status: saveStatusCode }))
        }
        // 해제는 body 없이 DELETE로 온다
        myStatus =
          options?.method === 'DELETE'
            ? null
            : (JSON.parse(body ?? '{}') as { status: string }).status
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

function renderView(initialStatus: string | null = null, saveStatusCode?: number) {
  const requests = stubApi(initialStatus, saveStatusCode)
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

/** 시트 안 선택지. 책 머리 뱃지와 이름이 같아 시트 안으로 좁혀 찾는다 */
async function statusOption(name: string) {
  const sheet = await screen.findByRole('dialog')
  return within(sheet).getByRole('button', { name })
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

  it('시트는 현재 상태를 고른 채 열린다', async () => {
    renderView('READING')

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))

    expect(await statusOption('읽고 있는 책')).toHaveAttribute('aria-pressed', 'true')
  })

  it('상태가 없으면 아무것도 고르지 않은 채 열리고 저장이 막혀 있다', async () => {
    renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))

    expect(await statusOption('읽고 있는 책')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('FINISHED면 책 머리에 완독 뱃지가 뜬다', async () => {
    renderView('FINISHED')

    expect(await screen.findByRole('button', { name: '완독' })).toBeInTheDocument()
  })

  it('완독을 골라 저장하면 PUT이 나가고 뱃지가 완독으로 바뀐다', async () => {
    const requests = renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))
    await userEvent.click(await statusOption('완독'))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('button', { name: '완독' })).toBeInTheDocument()

    const saved = requests.filter((request) => request.url.includes('/me/book-status'))
    expect(saved).toHaveLength(1)
    expect(saved[0]?.method).toBe('PUT')
    // 읽던 쪽을 지우지 않게 지금 페이지를 그대로 실어 보낸다 — 빠지면 서버가 null로 덮어쓴다
    expect(JSON.parse(saved[0]?.body ?? '{}')).toEqual({
      bookId: BOOK_ID,
      status: 'FINISHED',
      currentPage: 128,
    })
  })

  it('고른 것을 다시 눌러 풀고 저장하면 DELETE로 상태가 사라진다', async () => {
    const requests = renderView('READING')

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))
    // 시트에 해제 버튼이 없다 — 고른 것을 다시 눌러 푼다
    await userEvent.click(await statusOption('읽고 있는 책'))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('button', { name: '독서 상태' })).toBeInTheDocument()

    const saved = requests.filter((request) => request.url.includes('/me/book-status'))
    expect(saved).toHaveLength(1)
    expect(saved[0]?.method).toBe('DELETE')
    expect(saved[0]?.url).toContain(`bookId=${String(BOOK_ID)}`)
  })

  it('해제에 실패하면 뱃지가 그대로인 채로 다시 시도하라고 알린다', async () => {
    renderView('READING', 500)

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))
    await userEvent.click(await statusOption('읽고 있는 책'))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByText(/독서 상태를 저장하지 못했어요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '읽고 있는 책' })).toBeInTheDocument()
  })

  it('고른 값이 이미 저장된 값이면 저장이 막혀 있다', async () => {
    renderView('READING')

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))

    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })

  it('읽고 있는 책을 저장하면 PUT이 나가고 뱃지가 갱신된다', async () => {
    const requests = renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))
    await userEvent.click(await statusOption('읽고 있는 책'))
    await userEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('button', { name: '읽고 있는 책' })).toBeInTheDocument()

    const saved = requests.filter((request) => request.url.includes('/me/book-status'))
    expect(saved).toHaveLength(1)
    expect(saved[0]?.method).toBe('PUT')
    expect(JSON.parse(saved[0]?.body ?? '{}')).toEqual({
      bookId: BOOK_ID,
      status: 'READING',
      currentPage: 128,
    })
  })

  it('선택지는 라디오가 아니라 눌림 토글로 읽힌다 — 고른 것을 되돌릴 수 있어서다', async () => {
    renderView('READING')

    await userEvent.click(await screen.findByRole('button', { name: '읽고 있는 책' }))

    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).queryByRole('radio')).not.toBeInTheDocument()
    expect(within(sheet).getByRole('group', { name: '독서 상태' })).toBeInTheDocument()

    const reading = within(sheet).getByRole('button', { name: '읽고 있는 책', pressed: true })
    await userEvent.click(reading)
    // 눌림이 풀린다 — 라디오였다면 표현할 수 없는 상태다
    expect(reading).toHaveAttribute('aria-pressed', 'false')
  })

  it('키보드만으로 두 선택지를 오가며 고르고 풀 수 있다', async () => {
    renderView(null)

    await userEvent.click(await screen.findByRole('button', { name: '독서 상태' }))

    const finished = await statusOption('완독')
    const reading = await statusOption('읽고 있는 책')

    // roving tabindex — 그룹은 탭 순서에서 한 칸이고, 안에서는 좌우 키로 옮긴다
    expect(finished).toHaveAttribute('tabindex', '0')
    expect(reading).toHaveAttribute('tabindex', '-1')

    finished.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(reading).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(reading).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '저장하기' })).toBeEnabled()

    await userEvent.keyboard('{ArrowLeft}')
    expect(finished).toHaveFocus()

    await userEvent.keyboard(' ')
    expect(finished).toHaveAttribute('aria-pressed', 'true')
    // 하나만 눌린다 — 둘은 서로 배타적이다
    expect(reading).toHaveAttribute('aria-pressed', 'false')

    await userEvent.keyboard(' ')
    expect(finished).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled()
  })
})
