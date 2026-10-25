import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  title: '회원님의 의견에 댓글이 달렸어요',
  body: '“문장이 여기에 표시됩니다.”',
  opinionId: 7,
  bookId: 11,
  commentId: 3,
  isRead: false,
  createdAt: '2026-08-20T12:30:00',
}

const READ_NOTIFICATION: NotificationResponse = {
  ...NOTIFICATION,
  notificationId: 43,
  type: 'OPINION_LIKED',
  title: '회원님의 의견을 5명이 좋아해요',
  body: '빵충 사육 준수 사항 · 30p',
  isRead: true,
}

function renderView(notifications: NotificationResponse[] = [NOTIFICATION]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  for (const scope of ['ALL', 'ACTIVITY', 'GROUP', 'OPERATION'] as const) {
    client.setQueryData(notificationQueries.list(scope).queryKey, {
      pages: [
        {
          data: {
            notifications,
            unreadCount: notifications.filter((notification) => !notification.isRead).length,
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
  }

  return render(
    <QueryClientProvider client={client}>
      <NotificationInboxView />
    </QueryClientProvider>,
  )
}

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('알림함', () => {
  beforeEach(() => {
    // useLoadMoreOnVisible이 쓰는 IntersectionObserver는 happy-dom에 없다
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        takeRecords = () => []
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('알림 목록과 안 읽은 알림 개수를 보여준다', () => {
    renderView([NOTIFICATION, READ_NOTIFICATION])

    expect(screen.getByRole('heading', { name: '알림' })).toBeInTheDocument()
    expect(screen.getByText('회원님의 의견에 댓글이 달렸어요')).toBeInTheDocument()
    expect(screen.getByText('“문장이 여기에 표시됩니다.”')).toBeInTheDocument()
    expect(screen.getByText('댓글')).toBeInTheDocument()
    expect(screen.getByText('좋아요')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '1개의 알림',
      ),
    ).toBeVisible()
  })

  it('읽지 않은 알림에만 새 알림 표시를 단다', () => {
    renderView([NOTIFICATION, READ_NOTIFICATION])

    expect(screen.getAllByText('읽지 않음')).toHaveLength(1)
  })

  it('톱니 아이콘은 알림 설정 화면으로 이동한다', () => {
    renderView()

    expect(screen.getByRole('link', { name: '알림 설정' })).toHaveAttribute(
      'href',
      '/my/notification-settings',
    )
  })

  it('전체·활동·모임·운영 탭을 모두 노출한다', () => {
    renderView()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs[0]).toHaveTextContent('전체')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveTextContent('활동')
    expect(tabs[2]).toHaveTextContent('모임')
    expect(tabs[3]).toHaveTextContent('운영')
  })

  it('알림 목록 영역만 스크롤한다', () => {
    const { container } = renderView()

    expect(container.querySelector('[data-slot="notification-list"]')).toHaveClass(
      'overflow-y-auto',
    )
    expect(container.querySelector('[data-slot="notification-list"]')?.parentElement).toHaveClass(
      'overflow-hidden',
    )
  })

  it('선택한 분류 탭을 활성화한다', async () => {
    const user = userEvent.setup()
    renderView()

    await user.click(screen.getByRole('tab', { name: '모임' }))

    expect(screen.getByRole('tab', { name: '모임' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '전체' })).toHaveAttribute('aria-selected', 'false')
  })

  it('읽지 않은 알림을 누르면 읽음 처리하고 관련 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView()

    await user.click(screen.getByRole('button', { name: /회원님의 의견에 댓글이 달렸어요/ }))

    expect(routerMock.push).toHaveBeenCalledWith('/trace/11?opinionId=7')
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/42/read', expect.any(Object))
    })
  })

  it('이미 읽은 알림을 누르면 읽음 처리 없이 이동만 한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView([READ_NOTIFICATION])

    await user.click(screen.getByRole('button', { name: /회원님의 의견을 5명이 좋아해요/ }))

    expect(routerMock.push).toHaveBeenCalledWith('/trace/11?opinionId=7')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('모두 읽음을 누르면 전체 읽음 처리 API를 호출한다', async () => {
    const user = userEvent.setup()
    const fetchMock = stubFetch()
    renderView()

    await user.click(screen.getByRole('button', { name: '모두 읽음' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/notifications/read-all', expect.any(Object))
    })
  })

  it('알림이 없으면 빈 화면을 보여주고 모두 읽음을 숨긴다', () => {
    renderView([])

    expect(screen.getByText('아직 알림이 없어요.')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'P' && element.textContent === '0개의 알림',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: '모두 읽음' })).not.toBeInTheDocument()
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      expect.stringContaining('mascot-pair.webp'),
    )
  })
})
