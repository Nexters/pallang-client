import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { NotificationResponse } from '@/app/_global/_queries/notification.queries'
import { notificationQueries } from '@/app/_global/_queries/notification.queries'

import { NotificationInboxView } from '../_components/NotificationInboxView/NotificationInboxView'

const { routerMock } = vi.hoisted(() => ({
  routerMock: {
    back: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}))

const NOTIFICATION: NotificationResponse = {
  notificationId: 42,
  type: 'OPINION_COMMENTED',
  title: '새 댓글이 달렸어요',
  body: '내 의견에 댓글이 달렸어요.',
  opinionId: 7,
  bookId: 11,
  commentId: 3,
  isRead: false,
  createdAt: '2026-08-20T12:30:00',
}

function renderView(notifications: NotificationResponse[] = [NOTIFICATION]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  client.setQueryData(notificationQueries.list().queryKey, {
    pages: [
      {
        data: {
          notifications,
          pageInfo: {
            page: 0,
            size: 20,
            totalElements: notifications.length,
            totalPages: 1,
            hasNext: false,
          },
        },
      },
    ],
    pageParams: [0],
  })

  render(
    <QueryClientProvider client={client}>
      <NotificationInboxView />
    </QueryClientProvider>,
  )
}

describe('알림함', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('알림 목록을 보여준다', () => {
    renderView()

    expect(screen.getByRole('heading', { name: '알림함' })).toBeInTheDocument()
    expect(screen.getByText('새 댓글이 달렸어요')).toBeInTheDocument()
    expect(screen.getByText('내 의견에 댓글이 달렸어요.')).toBeInTheDocument()
    expect(screen.getByText('2026-08-20 12:30')).toBeInTheDocument()
  })

  it('단건 읽음 버튼을 누르면 읽음 처리 API를 호출한다', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    renderView()

    await user.click(screen.getByRole('button', { name: '읽음' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/42/read', expect.any(Object))
    })
  })

  it('알림 본문을 누르면 관련 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    renderView()

    await user.click(screen.getByRole('button', { name: /새 댓글이 달렸어요/ }))

    expect(routerMock.push).toHaveBeenCalledWith('/trace/11?opinionId=7')
  })

  it('전체 읽음 버튼을 누르면 전체 읽음 처리 API를 호출한다', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    renderView()

    await user.click(screen.getByRole('button', { name: '전체 읽음' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/read-all', expect.any(Object))
    })
  })
})
