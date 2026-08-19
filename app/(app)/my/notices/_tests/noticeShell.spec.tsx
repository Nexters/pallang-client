import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

function renderList(notices?: NoticeResponse[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (notices) {
    client.setQueryData(noticeQueries.list().queryKey, {
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
    })
  }
  render(
    <QueryClientProvider client={client}>
      <NoticeListView />
    </QueryClientProvider>,
  )
}

describe('공지사항 목록 셸', () => {
  it('목록이 도착하기 전에도 TopBar와 타이틀이 화면에 남는다', () => {
    renderList()

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
  })

  it('목록이 도착하면 제목과 날짜가 접힌 채로 선다', () => {
    renderList([NOTICE])

    const row = screen.getByRole('button', { name: /서비스 점검 안내/ })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('2026.08.01')).toBeInTheDocument()
    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })
})

describe('공지사항 펼치기', () => {
  // 시안(225:13761)은 상세로 이동하지 않고 목록 그 자리에서 본문을 펼친다
  it('제목을 누르면 상세로 이동하지 않고 같은 자리에서 본문이 펼쳐진다', async () => {
    const user = userEvent.setup()
    renderList([NOTICE])

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
    renderList([NOTICE])

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))
    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))

    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })

  it('다른 공지를 펼치면 먼저 펼친 공지는 접힌다', async () => {
    const user = userEvent.setup()
    renderList([NOTICE, OTHER_NOTICE])

    await user.click(screen.getByRole('button', { name: /서비스 점검 안내/ }))
    await user.click(screen.getByRole('button', { name: /업데이트 안내/ }))

    expect(screen.getByText('새 기능이 들어왔어요.')).toBeInTheDocument()
    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })
})
