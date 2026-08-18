import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MyLibraryView } from '../_components/MyLibraryView/MyLibraryView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const BOOK = {
  bookId: 12,
  title: '만조를 기다리며',
  author: '지은이',
  coverImageUrl: null,
  passageCount: 6,
  opinionCount: 17,
}

const PAGE_INFO = { page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false }

/** 서재 응답을 고정하고 실제로 나간 요청 url을 돌려준다 */
function stubApi(response: { body?: unknown; status?: number }) {
  const calls: string[] = []

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
    vi.unstubAllGlobals()
  })

  it('서버가 준 도서를 제목·대목수·흔적수와 함께 보여준다', async () => {
    stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    expect(await screen.findByText('만조를 기다리며')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
  })

  it('page 기반으로 첫 페이지를 요청한다', async () => {
    const calls = stubApi({ body: { data: { books: [BOOK], pageInfo: PAGE_INFO } } })
    renderView()

    await screen.findByText('만조를 기다리며')
    expect(calls[0]).toBe('/api/books/my-library?page=0')
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
})
