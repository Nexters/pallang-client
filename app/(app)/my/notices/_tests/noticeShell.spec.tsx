import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { NoticeResponse } from '@/app/_global/_queries/notice.queries'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { NoticeListView } from '../_components/NoticeListView/NoticeListView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const NOTICE: NoticeResponse = {
  noticeId: 7,
  title: '서비스 점검 안내',
  content: '8월 10일 새벽에 점검이 있어요.',
  createdAt: '2026-08-01T09:00:00',
}

const OTHER_NOTICE: NoticeResponse = {
  noticeId: 8,
  title: '업데이트 안내',
  content: '새 기능이 들어왔어요.',
  createdAt: '2026-08-08T09:00:00',
}

/** 캐시를 stale로 만들 만큼 지난 시각 — 쿼리의 staleTime은 5분이다 */
const LONG_AGO = 10 * 60 * 1000

type RenderOptions = {
  /** 화면에 들어오기 전 캐시에 들어 있던 목록 */
  cached?: NoticeResponse[]
  /** 캐시를 stale로 두어 마운트할 때 백그라운드 refetch가 돌게 한다 */
  staleCached?: boolean
  /** 서버가 줄 목록. 주지 않으면 서버는 500으로 답한다 */
  served?: NoticeResponse[]
}

function toListPayload(notices: NoticeResponse[]) {
  return {
    data: {
      notices,
      pageInfo: {
        page: 0,
        size: 100,
        totalElements: notices.length,
        totalPages: 1,
        hasNext: false,
      },
    },
  }
}

function renderList({ cached, staleCached, served }: RenderOptions = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => {
      if (!served) return Promise.resolve(new Response('{}', { status: 500 }))
      return Promise.resolve(new Response(JSON.stringify(toListPayload(served))))
    }),
  )

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (cached) {
    client.setQueryData(noticeQueries.list().queryKey, toListPayload(cached), {
      updatedAt: staleCached ? Date.now() - LONG_AGO : Date.now(),
    })
  }
  render(
    <QueryClientProvider client={client}>
      <NoticeListView />
    </QueryClientProvider>,
  )
  return client
}

/** 백그라운드 refetch가 실패로 끝날 때까지 기다린다 */
async function waitForErrorStatus(client: QueryClient) {
  await waitFor(() => {
    expect(client.getQueryState(noticeQueries.list().queryKey)?.status).toBe('error')
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('공지사항 목록 셸', () => {
  it('목록이 도착하기 전에도 TopBar와 타이틀이 화면에 남는다', () => {
    renderList()

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
  })

  it('목록이 도착하면 제목과 날짜가 접힌 채로 선다', () => {
    renderList({ cached: [NOTICE] })

    const row = screen.getByRole('button', { name: /서비스 점검 안내/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('2026.08.01')).toBeInTheDocument()
    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })

  it('공지가 하나도 없으면 빈 상태 문구를 보여준다', async () => {
    renderList({ served: [] })

    expect(await screen.findByText('공지사항이 없어요')).toBeInTheDocument()
  })
})

describe('공지사항 조회 실패', () => {
  it('처음부터 실패하면 다시 불러오기를 보여준다', async () => {
    renderList()

    expect(await screen.findByText('공지사항을 불러오지 못했어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument()
  })

  // 오프라인 복귀처럼 focus refetch가 실패하면 query 상태가 error로 뒤집힌다 — 목록까지 지우면 안 된다
  it('보고 있던 목록은 백그라운드 새로고침이 실패해도 남는다', async () => {
    const client = renderList({ cached: [NOTICE], staleCached: true })

    await waitForErrorStatus(client)

    expect(screen.getByRole('button', { name: /서비스 점검 안내/ })).toBeInTheDocument()
    expect(screen.queryByText('공지사항을 불러오지 못했어요.')).not.toBeInTheDocument()
  })

  it('새로고침이 실패해도 펼치기는 그대로 동작한다', async () => {
    const user = userEvent.setup()
    const client = renderList({ cached: [NOTICE], staleCached: true })

    await waitForErrorStatus(client)
    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))

    expect(screen.getByText('8월 10일 새벽에 점검이 있어요.')).toBeInTheDocument()
  })
})

describe('공지사항 펼치기', () => {
  // 시안은 상세로 이동하지 않고 목록 그 자리에서 본문을 펼친다
  it('제목을 누르면 상세로 이동하지 않고 같은 자리에서 본문이 펼쳐진다', async () => {
    const user = userEvent.setup()
    renderList({ cached: [NOTICE] })

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))

    expect(screen.getByText('8월 10일 새벽에 점검이 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /서비스 점검 안내/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // 상세 라우트로 나가는 링크가 없다
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('펼친 공지를 다시 누르면 접힌다', async () => {
    const user = userEvent.setup()
    renderList({ cached: [NOTICE] })

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))
    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))

    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })

  it('다른 공지를 펼치면 먼저 펼친 공지는 접힌다', async () => {
    const user = userEvent.setup()
    renderList({ cached: [NOTICE, OTHER_NOTICE] })

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))
    await user.click(screen.getByRole('button', { name: /업데이트 안내/ }))

    expect(screen.getByText('새 기능이 들어왔어요.')).toBeInTheDocument()
    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })

  it('접힌 공지는 없는 본문을 가리키지 않는다', () => {
    renderList({ cached: [NOTICE] })

    const row = screen.getByRole('button', { name: /서비스 점검 안내/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    expect(row).not.toHaveAttribute('aria-controls')
  })

  it('펼친 공지의 aria-controls는 실제 본문을 가리킨다', async () => {
    const user = userEvent.setup()
    renderList({ cached: [NOTICE] })

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))

    const panelId = screen
      .getByRole('button', { name: /서비스 점검 안내/ })
      .getAttribute('aria-controls')
    expect(panelId).not.toBeNull()
    expect(document.getElementById(panelId ?? '')).toHaveTextContent(
      '8월 10일 새벽에 점검이 있어요.',
    )
  })
})
