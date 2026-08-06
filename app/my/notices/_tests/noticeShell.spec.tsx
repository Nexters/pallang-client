import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { NoticeResponse } from '@/app/_global/_queries/notice.queries'
import { noticeQueries } from '@/app/_global/_queries/notice.queries'

import { NoticeListView } from '../_components/NoticeListView/NoticeListView'
import { NoticeDetailView } from '../[noticeId]/_components/NoticeDetailView/NoticeDetailView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}))

const NOTICE: NoticeResponse = {
  noticeId: 7,
  title: '서비스 점검 안내',
  content: '8월 10일 새벽에 점검이 있어요.',
  createdAt: '2026-08-01T09:00:00',
}

function renderWith(view: ReactNode, notices?: NoticeResponse[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (notices) {
    client.setQueryData(noticeQueries.list().queryKey, {
      data: {
        notices,
        pageInfo: { page: 0, size: 100, totalElements: 1, totalPages: 1, hasNext: false },
      },
    })
  }
  render(<QueryClientProvider client={client}>{view}</QueryClientProvider>)
}

describe('공지사항 목록 셸', () => {
  it('목록이 도착하기 전에도 TopBar와 타이틀이 화면에 남는다', () => {
    renderWith(<NoticeListView />)

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('목록이 도착하면 같은 셸 안에 상세 링크가 들어선다', () => {
    renderWith(<NoticeListView />, [NOTICE])

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /서비스 점검 안내/ })).toHaveAttribute(
      'href',
      '/my/notices/7',
    )
    expect(screen.getByText('2026.08.01')).toBeInTheDocument()
  })
})

describe('공지사항 상세', () => {
  it('목록 캐시에 본문이 있으면 다시 받지 않고 바로 그린다', () => {
    renderWith(<NoticeDetailView noticeId={7} />, [NOTICE])

    expect(screen.getByRole('heading', { level: 2, name: '서비스 점검 안내' })).toBeInTheDocument()
    expect(screen.getByText('8월 10일 새벽에 점검이 있어요.')).toBeInTheDocument()
  })

  it('직접 진입해 캐시가 비면 셸만 남기고 본문 자리를 골격으로 채운다', () => {
    renderWith(<NoticeDetailView noticeId={7} />)

    expect(screen.getByRole('heading', { name: '공지사항' })).toBeInTheDocument()
    expect(screen.queryByText('8월 10일 새벽에 점검이 있어요.')).not.toBeInTheDocument()
  })
})
